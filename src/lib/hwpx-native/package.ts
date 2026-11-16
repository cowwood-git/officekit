import JSZip from 'jszip';

const VERSION_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><hv:HCFVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" tagetApplication="WORDPROCESSOR" major="5" minor="1" micro="0" buildNumber="1" os="1" xmlVersion="1.5" application="Hancom Office Hangul" appVersion="11, 0, 0, 3524 WIN32LEWindows_8"/>`;

const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><ha:HWPApplicationSetting xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"><ha:CaretPosition listIDRef="0" paraIDRef="0" pos="16"/></ha:HWPApplicationSetting>`;

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf"><ocf:rootfiles><ocf:rootfile full-path="Contents/content.hpf" media-type="application/hwpml-package+xml"/><ocf:rootfile full-path="Preview/PrvText.txt" media-type="text/plain"/><ocf:rootfile full-path="META-INF/container.rdf" media-type="application/rdf+xml"/></ocf:rootfiles></ocf:container>`;

const MANIFEST_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><odf:manifest xmlns:odf="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"/>`;

const CONTAINER_RDF = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about=""><rdf:Bag/></rdf:Description></rdf:RDF>`;

const contentHpf = (images: readonly { name: string; mime: string }[]): string =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><opf:package xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" version="" unique-identifier="" id=""><opf:metadata><opf:title/><opf:language>ko</opf:language><opf:meta name="creator" content="text">옷깃</opf:meta><opf:meta name="CreatedDate" content="text"/><opf:meta name="ModifiedDate" content="text"/></opf:metadata><opf:manifest><opf:item id="header" href="Contents/header.xml" media-type="application/xml"/><opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/><opf:item id="settings" href="settings.xml" media-type="application/xml"/>${images
    .map(
      (image) =>
        `<opf:item id="${image.name}" href="BinData/${image.name}" media-type="${image.mime}"/>`,
    )
    .join(
      '',
    )}</opf:manifest><opf:spine><opf:itemref idref="header" linear="yes"/><opf:itemref idref="section0" linear="yes"/></opf:spine></opf:package>`;

export interface HwpxPackage {
  headXml: string;
  sectionXml: string;
  images: readonly { name: string; data: Uint8Array; mime: string }[];
}

/** HWPX 컨테이너를 만든다. mimetype은 반드시 첫 항목·무압축이어야 한다. */
export async function packHwpx(files: HwpxPackage): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file('mimetype', 'application/hwp+zip', { compression: 'STORE' });
  zip.file('version.xml', VERSION_XML);
  zip.file('settings.xml', SETTINGS_XML);
  zip.file('META-INF/container.xml', CONTAINER_XML);
  zip.file('META-INF/manifest.xml', MANIFEST_XML);
  zip.file('META-INF/container.rdf', CONTAINER_RDF);
  zip.file('Preview/PrvText.txt', '');
  zip.file('Contents/content.hpf', contentHpf(files.images));
  zip.file('Contents/header.xml', files.headXml);
  zip.file('Contents/section0.xml', files.sectionXml);
  for (const image of files.images) {
    zip.file(`BinData/${image.name}`, image.data);
  }
  const buffer = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  return buffer;
}
