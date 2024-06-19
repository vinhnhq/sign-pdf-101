import type { InputType } from '@signpdf/placeholder-plain';
import { plainAddPlaceholder } from '@signpdf/placeholder-plain';
import { P12Signer } from '@signpdf/signer-p12';
import { SignPdf } from '@signpdf/signpdf';
import fs from 'fs';
import { Recipe } from 'muhammara';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(import.meta.url);

async function addPlaceholder(
  pdfBuffer: Buffer,
  options: Pick<InputType, 'reason' | 'contactInfo' | 'name' | 'location' | 'widgetRect'>
) {
  return plainAddPlaceholder({
    pdfBuffer,
    reason: options.reason,
    contactInfo: options.contactInfo,
    name: options.name,
    location: options.location,
    widgetRect: options.widgetRect,
  });
}

async function signPdf(pdfBuffer: Buffer, certificatePath: string, passphrase: string, targetPath: string) {
  const certificateBuffer = fs.readFileSync(path.join(__dirname, certificatePath));
  const signer = new P12Signer(certificateBuffer, { passphrase });
  const signPdf = new SignPdf();

  const signedPdf = await signPdf.sign(pdfBuffer, signer);
  fs.writeFileSync(targetPath, signedPdf);
  return signedPdf;
}

function drawTextOnWidget(pdfPath: string, outputPath: string, text: string, widgetRect: { x: number; y: number }) {
  const pdfDoc = new Recipe(pdfPath, outputPath);

  pdfDoc.editPage(1).text(text, widgetRect.x, widgetRect.y).endPage().endPDF();
}

async function work() {
  const pdfPath = path.join(__dirname, '/key/bmgd/ndomino_fullstack.14_signature.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);

  const pdfWithBuyerPlaceholder = await addPlaceholder(pdfBuffer, {
    reason: 'Agrees to buy the truck trailer.',
    contactInfo: 'john@example.com',
    name: 'John Doe',
    location: 'Free Text Str., Free World',
    widgetRect: [200, 200, 300, 300],
  });

  const buyerSignedPdfPath = path.join(__dirname, 'sig-1.pdf');
  await signPdf(pdfWithBuyerPlaceholder, '/key/certificate.p12', 'Password@123', buyerSignedPdfPath);

  drawTextOnWidget(buyerSignedPdfPath, path.join(__dirname, 'sig-done.pdf'), 'Buyer Signature', { x: 250, y: 250 });

  return;

  const buyerSignedPdfBuffer = fs.readFileSync(buyerSignedPdfPath);
  const pdfWithSellerPlaceholder = await addPlaceholder(buyerSignedPdfBuffer, {
    reason: 'Agrees to sell a truck trailer to John Doe.',
    contactInfo: 'dealer@example.com',
    name: 'Thug Dealer',
    location: 'Automotive Str., Free World',
    widgetRect: [400, 400, 500, 500],
  });

  const sellerSignedPdfPath = path.join(__dirname, './multiple-signatures-buyer-seller-2.pdf');
  const finalSignedPdf = await signPdf(pdfWithSellerPlaceholder, '2/2.p12', '654321', sellerSignedPdfPath);

  drawTextOnWidget(
    sellerSignedPdfPath,
    path.join(__dirname, './multiple-signatures-buyer-seller-3.pdf'),
    'Seller Signature',
    { x: 450, y: 450 }
  );

  console.log('PDF signed by both buyer and seller with text drawn on widgetRect.');
}

console.log('work --> start');

work();
