export async function test() {
  const html2pdf = (await import("html2pdf.js")).default;
  console.log(html2pdf);
}
