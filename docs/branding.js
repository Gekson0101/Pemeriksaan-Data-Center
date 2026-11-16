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
})(window);
