(function(root) {
  'use strict';
  const widths=[6,19,34,25,17,34,28];
  const colors={green:'123C36',light:'E7F0EB',line:'CBD9D2',ink:'18342E',pass:'17653E',fail:'AC333C'};
  const statuses={pass:'Sesuai',fail:'Tidak sesuai',na:'Tidak berlaku',deferred:'Tertunda','':'Belum dinilai'};
  let libraryPromise;

  function loadLibrary() {
    if (root.ExcelJS) return Promise.resolve(root.ExcelJS);
    if (!libraryPromise) libraryPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='./vendor/exceljs-4.4.0.min.js';
      script.onload=()=>root.ExcelJS ? resolve(root.ExcelJS) : reject(new Error('Pustaka Excel belum siap.'));
      script.onerror=()=>{script.remove();libraryPromise=null;reject(new Error('Pustaka Excel gagal dimuat. Periksa koneksi dan coba kembali.'));};
      document.head.appendChild(script);
    });
    return libraryPromise;
  }

  function photoData(photo) {
    return new Promise((resolve,reject)=>{
      const match=/^data:image\/(jpeg|png|webp);base64,/i.exec(photo?.data||'');
      if (!match) {reject(new Error('Foto bukti tidak dapat dibaca. Periksa foto pada laporan.'));return;}
      const image=new Image();
      image.onload=()=>{
        try {
          let base64=photo.data,extension=match[1].toLowerCase();
          if (extension==='webp') {
            const canvas=document.createElement('canvas');
            canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
            canvas.getContext('2d').drawImage(image,0,0);
            base64=canvas.toDataURL('image/png');extension='png';
          }
          resolve({base64,extension,width:image.naturalWidth,height:image.naturalHeight});
        } catch {reject(new Error('Foto bukti gagal diproses. Periksa foto pada laporan.'));}
      };
      image.onerror=()=>reject(new Error('Foto bukti rusak atau formatnya belum dapat dibaca.'));
      image.src=photo.data;
    });
  }

  function dateText(value) {
    if (!value) return 'Belum tercatat';
    const date=new Date(value.length===10?value+'T12:00:00+07:00':value);
    if (isNaN(date)) return String(value);
    const options=value.length===10?{dateStyle:'full'}:{dateStyle:'long',timeStyle:'short'};
    return new Intl.DateTimeFormat('id-ID',{...options,timeZone:'Asia/Jakarta'}).format(date)+(value.length===10?'':' WIB');
  }

  // Bound each physical row so long notes remain visible in Excel and print.
  function textParts(value,width) {
    const lines=[];
    for (const line of String(value??'').split('\n')) {
      if (!line) lines.push('');
      let remainder=line;
      while (remainder.length>width) {
        const space=remainder.lastIndexOf(' ',width);
        const end=space>0?space:width;
        lines.push(remainder.slice(0,end));
        remainder=remainder.slice(end).trimStart();
      }
      if (remainder) lines.push(remainder);
    }
    const parts=[];
    for (let start=0;start<lines.length;start+=18) parts.push(lines.slice(start,start+18).join('\n'));
    return parts.length?parts:[''];
  }

  async function build(session) {
    const ExcelJS=await loadLibrary(),C=root.DCICore,D=root.DCIData;
    const workbook=new ExcelJS.Workbook();
    workbook.creator='DC Inspect';workbook.created=new Date();
    const period=D.periods[session.period]||session.period;
    const sheet=workbook.addWorksheet('Pemeriksaan',{
      properties:{defaultRowHeight:22},
      pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,
        margins:{left:0.25,right:0.25,top:0.35,bottom:0.35,header:0.15,footer:0.15}},
      headerFooter:{oddFooter:'&LDC Inspect&CHalaman &P dari &N'}
    });
    sheet.columns=widths.map(width=>({width}));
    sheet.views=[{showGridLines:false,state:'frozen',ySplit:10}];
    const border={style:'thin',color:{argb:colors.line}};
    function add(values,height=24) {
      const row=sheet.addRow(values.map(value=>value===''?null:value));row.height=height;
      for(let column=1;column<=7;column++) {
        const cell=row.getCell(column);
        cell.font={name:'Calibri',size:11,color:{argb:colors.ink}};
        cell.alignment={vertical:'top',wrapText:true};
        cell.border={top:border,left:border,bottom:border,right:border};
      }
      return row;
    }
    function band(text,fill=colors.green,height=30) {
      const row=add([text],height);sheet.mergeCells(row.number,1,row.number,7);
      const cell=row.getCell(1);cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:fill}};
      cell.font={name:'Calibri',size:12,bold:true,color:{argb:fill===colors.green?'FFFFFF':colors.ink}};
      cell.alignment={vertical:'middle',wrapText:true};
      return row;
    }
    function metadata(name,value,otherName,otherValue) {
      const row=add([name,'',value,'',otherName,otherValue,''],32);
      sheet.mergeCells(row.number,1,row.number,2);sheet.mergeCells(row.number,3,row.number,4);sheet.mergeCells(row.number,6,row.number,7);
      for(const column of [1,5]) {row.getCell(column).font={name:'Calibri',size:11,bold:true,color:{argb:colors.ink}};row.getCell(column).fill={type:'pattern',pattern:'solid',fgColor:{argb:colors.light}};}
    }
    const rows=session.rows||[],metrics=C.metrics(rows);
    const photoCount=rows.reduce((total,row)=>total+(row.evidence?.length||0),0);
    const title=band(`FORMULIR MONITORING ${period.toUpperCase()} DATA CENTER`,colors.green,36);
    title.getCell(1).alignment={vertical:"middle",horizontal:"center",wrapText:true};
    metadata('Nomor laporan',session.number||'DRAF','Status',session.finalizedAt?'Final':'Draf');
    metadata('Hari / tanggal',dateText(session.date),'Periode',period);
    metadata('Petugas',session.inspector||'Belum diisi','Pusat data',session.site||'Belum diisi');
    metadata('Mulai pencatatan',dateText(session.createdAt),'Laporan dikirim',dateText(session.finalizedAt));
    metadata('Cakupan',`${C.groupByAsset(rows).length} aset · ${C.groupByParameter(rows).length} parameter · ${rows.length} penilaian`,'Sif',session.shift||'Umum');
    metadata('Hasil pemeriksaan',`${metrics.pass} sesuai · ${metrics.fail} tidak sesuai`, 'Foto bukti',`${photoCount} foto`);
    metadata('Isian lainnya',`${metrics.pending} belum dinilai · ${metrics.na} tidak berlaku · ${metrics.deferred} tertunda`,'Pemeriksaan',period);
    band('TABEL CHECKLIST PEMERIKSAAN',colors.light,28);
    const headers=add(['No','Kode Aset','Nama Aset','Lokasi','Hasil','Keterangan Petugas / Hasil Ukur','Foto Bukti'],34);
    headers.eachCell(cell=>{cell.font={name:'Calibri',size:11,bold:true,color:{argb:'FFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:colors.green}};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};});
    sheet.pageSetup.printTitlesRow='9:10';
    let number=0;
    for (const category of C.groupByCategory(rows)) {
      band(D.formalLabel(category.name),colors.green);
      for (const assetRows of C.groupByParameter(category.rows)) {
        const asset=assetRows[0];
        band(D.formalLabel(asset.title),colors.light,Math.max(38,Math.ceil(asset.title.length/110)*16+12));
        for (const record of assetRows) {
          number++;
          const notes=[record.note];
          if (String(record.reading??'').trim()) notes.push(`Hasil ukur: ${record.reading}`);
          if (record.status==='fail') {
            if(record.priority) notes.push(`Prioritas: ${record.priority}`);
            if(record.pic) notes.push(`PIC: ${record.pic}`);
            if(record.target) notes.push(`Target tindak lanjut: ${record.target}`);
          }
          const objects=C.reportObjects(record);
          const values=[number,record.assetCode||'—',D.formalLabel(record.assetName),
            record.location||'—',
            statuses[record.status]||'Belum dinilai',notes.filter(Boolean).join('\n')||'—'];
          const parts=values.map((value,index)=>textParts(value,Math.max(5,widths[index]-3)));
          const photos=record.evidence||[];
          const count=Math.max(...parts.map(part=>part.length),photos.length,1);
          for(let index=0;index<count;index++) {
            const cells=parts.map(part=>part[index]||'');
            const lines=Math.max(...cells.map(value=>value.split('\n').length));
            const row=add([...cells,index===0&&!photos.length?'—':''],Math.max(44,lines*14+12,photos[index]?150:0));
            row.getCell(1).alignment={vertical:'top',horizontal:'center',wrapText:true};
            if(index===0) {
              const result=row.getCell(5),fill=record.status==='fail'?colors.fail:record.status==='pass'?colors.pass:'EDEFEF';
              result.fill={type:'pattern',pattern:'solid',fgColor:{argb:fill}};
              result.font={name:'Calibri',size:11,bold:true,color:{argb:['fail','pass'].includes(record.status)?'FFFFFF':colors.ink}};
              result.alignment={vertical:'middle',horizontal:'center',wrapText:true};
            }
            if(photos[index]) {
              const photo=await photoData(photos[index]);
              const imageId=workbook.addImage({base64:photo.base64,extension:photo.extension});
              const maxWidth=widths[6]*7-12,maxHeight=row.height*4/3-12;
              const ratio=Math.min(maxWidth/photo.width,maxHeight/photo.height,1);
              // Two-cell anchors preserve the photo in Excel-compatible readers.
              sheet.addImage(imageId,{
                tl:{nativeCol:6,nativeColOff:57150,nativeRow:row.number-1,nativeRowOff:57150},
                br:{nativeCol:6,nativeColOff:Math.round((6+photo.width*ratio)*9525),nativeRow:row.number-1,nativeRowOff:Math.round((6+photo.height*ratio)*9525)},
                editAs:'oneCell'
              });
            }
          }
        }
      }
    }
    sheet.pageSetup.printArea=`A1:G${sheet.rowCount}`;
    return workbook.xlsx.writeBuffer();
  }
  root.DCIExcel={build};
})(typeof window!=='undefined'?window:globalThis);
