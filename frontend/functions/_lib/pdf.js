// Minimal text PDF using standard Type1 Helvetica, ASCII escaping, pagination,
// byte-correct xref offsets. No native libraries, filesystem, or browser required.
export function pdf(title, lines) {
  const escape=(s)=>String(s).normalize('NFKD').replace(/[^\x20-\x7e]/g,'?').replace(/([\\()])/g,'\\$1');
  const wrapped=[title,'',...lines].flatMap(line=>{
    const words=String(line).split(/\s+/), out=[];let current='';
    for(const word of words) {if(current.length+word.length>88){out.push(current);current='';}current+=(current?' ':'')+word;}
    out.push(current);return out;
  });
  const objects=['','<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pages=[];
  for(let start=0;start<wrapped.length;start+=48) {
    const content=`BT /F1 10 Tf 48 744 Td 14 TL\n${wrapped.slice(start,start+48).map((line,i)=>`${i?'T* ':''}(${escape(line)}) Tj`).join('\n')}\nET`;
    const page=objects.length; pages.push(`${page} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${page+1} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  }
  objects[2]=`<< /Type /Pages /Kids [${pages.join(' ')}] /Count ${pages.length} >>`;
  let output='%PDF-1.4\n'; const offsets=[0];
  for(let i=1;i<objects.length;i++){offsets.push(output.length);output+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
  const xref=output.length;
  output+=`xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(output);
}
