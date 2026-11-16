(function(root) {
  'use strict';
  const logoUrl=new URL('./assets/logo-pusdatik.png',document.currentScript.src).href;
  let logoPromise;
  // One original logo is shared by the interface, print view and Excel export.
  function excelLogo() {
    if(!logoPromise) logoPromise=(async()=>{
      const response=await fetch(logoUrl);
      if(!response.ok)throw new Error('Logo laporan gagal dimuat. Muat ulang halaman dan coba kembali.');
      const blob=await response.blob();
      const base64=await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result);
        reader.onerror=()=>reject(new Error('Logo laporan tidak dapat dibaca.'));
        reader.readAsDataURL(blob);
      });
      const image=new Image();image.src=base64;await image.decode();
      return {base64,extension:'png',width:image.naturalWidth,height:image.naturalHeight};
    })().catch(error=>{logoPromise=null;throw error;});
    return logoPromise;
  }
  root.DCIBranding={logoUrl,name:'Pusdatik BSSN',excelLogo};
  // Prepare a compact display texture with staged downsampling. Directly drawing
  // the large transparent source into a tiny icon can alias the fine gold rings.
  const displayImage=new Image();
  displayImage.onload=()=>{
    let canvas=document.createElement('canvas');
    canvas.width=canvas.height=1799;
    canvas.getContext('2d').drawImage(displayImage,667,21,1799,1799,0,0,1799,1799);
    while(canvas.width>256) {
      const next=document.createElement('canvas');
      next.width=next.height=Math.max(256,Math.round(canvas.width/2));
      const context=next.getContext('2d');
      context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
      context.drawImage(canvas,0,0,next.width,next.height);canvas=next;
    }
    root.DCIBranding.logoUrl=canvas.toDataURL('image/png');
    document.querySelectorAll('.brand-logo,.topbar-logo,.report-logo').forEach(image=>{image.src=root.DCIBranding.logoUrl;});
  };
  displayImage.src=logoUrl;
})(window);
