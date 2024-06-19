import { plainAddPlaceholder } from '@signpdf/placeholder-plain';
import { P12Signer } from '@signpdf/signer-p12';
import signpdf from '@signpdf/signpdf';
import fs from 'fs';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

const password = 'Password@123';

async function addSignatureToPDF() {
  // Load the existing PDF file
  const existingPDFBytes = fs.readFileSync(`${__dirname}/key/bmgd/ndomino_fullstack.14.pdf`);
  const pdfDoc = await PDFDocument.load(existingPDFBytes);

  // Create a new page to add the signature
  const [firstPage] = pdfDoc.getPages();

  // Load the signature image
  const signatureImageBytes = fs.readFileSync(`${__dirname}/data/signature.png`);

  // Embed the signature image
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

  // Get the dimensions of the signature image
  const { width, height } = signatureImage.scale(0.5);

  // Position and draw the signature image on the page
  firstPage.drawImage(signatureImage, {
    x: 100,
    y: 100,
    width,
    height,
    rotate: degrees(45),
    opacity: 0.8,
  });

  // Save the modified PDF
  const modifiedPDFBytes = await pdfDoc.save({ useObjectStreams: false });

  fs.writeFileSync(`${__dirname}/ndomino_fullstack.14_signature.pdf`, modifiedPDFBytes);

  return modifiedPDFBytes;
}

async function work(pdfBytes: Uint8Array) {
  // convert to Buffer
  const pdfBuffer = Buffer.from(pdfBytes);

  // contributing.pdf is the file that is going to be signed
  // const pdfBuffer = fs.readFileSync(`${__dirname}/key/bmgd/ndomino_fullstack.14_signature.pdf`);
  console.log('work --> pdfBuffer', pdfBuffer.length);

  // certificate.p12 is the certificate that is going to be used to sign
  const certificateBuffer = fs.readFileSync(`${__dirname}/key/certificate.p12`);
  console.log('work --> certificateBuffer', certificateBuffer.length);

  // The PDF needs to have a placeholder for a signature to be signed.
  const pdfWithPlaceholder = plainAddPlaceholder({
    pdfBuffer,
    reason: 'The user is decalaring consent.',
    contactInfo: 'signpdf@example.com',
    name: 'John Doe',
    location: 'Free Text Str., Free World',
  });
  console.log('work --> pdfWithPlaceholder', pdfWithPlaceholder.length);

  const signer = new P12Signer(certificateBuffer, {
    passphrase: password,
  });
  console.log('work --> signer', 'done');

  // pdfWithPlaceholder is now a modified buffer that is ready to be signed.
  const signedPdf = await signpdf.sign(pdfWithPlaceholder, signer);
  console.log('work --> signedPdf', signedPdf.length);

  // signedPdf is a Buffer of an electronically signed PDF. Store it.
  const targetPath = `${__dirname}/ndomino_fullstack.14_signed.pdf`;
  fs.writeFileSync(targetPath, signedPdf);
}

addSignatureToPDF().then((pdfBytes: Uint8Array) => {
  console.log('Signature added to PDF');

  work(pdfBytes).then(() => {
    console.log('PDF signed');
  });
});
