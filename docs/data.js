(function(root) {
  'use strict';
  function formalLabel(value) {
    return String(value??'')
      .replace(/menara pendingin/gi,'Cooling Tower')
      .replace(/\bmenara\b/gi,'Cooling Tower')
      .replace(/\bgenset\b/gi,'Generator Set')
      .replace(/\btransformator\b|\btrafo\b/gi,'Transformer')
      .replace(/UPS statis/gi,'Static UPS')
      .replace(/UPS dinamis/gi,'Dynamic UPS')
      .replace(/kontrol akses/gi,'Access Control')
      .replace(/unit pendingin ruangan/gi,'Indoor Air-conditioning Unit')
      .replace(/distribusi daya/gi,'Power Distribution')
      .replace(/penyimpanan bahan bakar/gi,'Bulk Fuel Storage')
      .replace(/keselamatan kebakaran/gi,'Fire Safety')
      .replace(/Raised\/access floor/gi,'Raised Floor')
      .replace(/Fasilitas umum/g,'Fasilitas Umum')
      .replace(/tingkat bahan bakar/gi,'level bahan bakar')
      .replace(/tingkat oli/gi,'level oli');
  }
  const periods={daily:'Harian',weekly:'Mingguan',monthly:'Bulanan',quarterly:'Triwulanan',yearly:'Tahunan'};
  const categories=[
    ['facility','Fasilitas umum','784','Bangunan & area'],['plumbing','Plumbing','785','Air & perpipaan'],['lift','Lift','786','Transportasi vertikal'],['floor','Raised/access floor','787','Lantai teknis'],['bms','Sistem pemantauan (EMS/BMS)','788','Sensor & kendali'],['cctv','CCTV','789','Kamera & perekaman'],['access','Kontrol akses','790','Pintu & akses'],['fire','Keselamatan kebakaran','791','Proteksi kebakaran'],['fuel','Penyimpanan bahan bakar','792','Tangki & penyaluran'],['generator','Genset','793','Daya cadangan'],['transformer','Transformator','794','Transformasi daya'],['power','Distribusi daya','795','Panel, ATS & PDU'],['ups','UPS statis','796','UPS & baterai'],['dynamic','UPS dinamis','797','Daya rotari'],['chiller','Chiller','798','Pendingin sentral'],['tower','Menara pendingin','799','Menara pendingin'],['hvac','Unit pendingin ruangan','800','Pendingin ruangan']
  ].map(([id,name,page,group])=>({id,name:formalLabel(name),group:formalLabel(group),sourceUrl:`https://www.epi-ap.com/dcos-standard/page/72/${page}`}));
  const rules=[];
  function add(category,period,title,options={}) {
    const c=categories.find(c=>c.id===category);
    rules.push({id:`${category}-${period}-${rules.filter(t=>t.category===category&&t.period===period).length+1}`,category,period,title,
      source:options.user?'Parameter pengguna':options.site?'Usulan operasional':'Adaptasi EPI',sourceUrl:options.user||options.site?'':c.sourceUrl,originalPeriod:options.site?'Tambahan lokal':periods[period],
      criterion:options.criterion||'Sesuai SOP dan ketentuan OEM aset. Tetapkan batas penerimaan sebelum pemakaian operasional.',
      method:options.method||'Visual / verifikasi',role:options.specialist?'Teknisi / vendor kompeten':'Petugas inspeksi',measurement:options.measurement||false,applies:options.applies||null});
    if(options.user)rules[rules.length-1].id=`user-dcos2021-daily-${category}-${rules.filter(t=>t.category===category&&t.period===period).length}`;
  }
  function many(category,period,titles,options={}) {titles.forEach(title=>add(category,period,title,options));}
  add('facility','daily','Periksa seluruh keran air, kepala pancuran, dan toilet untuk memastikan tidak ada kebocoran atau aliran air yang terus mengalir, termasuk kebocoran pada gagang keran.',{user:true});
  many('facility','weekly',['Periksa kebersihan area luar dan kondisi lanskap.','Periksa fungsi penerangan umum.']);
  many('facility','monthly',['Tinjau pelaksanaan pengendalian hama.','Periksa jejak kebocoran atau kelembapan bangunan.']);
  many('facility','yearly',['Tinjau kondisi struktur, dinding, lantai, plafon, tangga, dan pagar.','Periksa kondisi pintu, jendela, bagian bergerak, dan penutupnya.','Periksa area luar serta keterbacaan rambu.'],{specialist:true});
  add('plumbing','weekly','Periksa kebocoran keran, pancuran, dan toilet.');
  many('plumbing','monthly',['Periksa kelancaran saluran pembuangan serta jejak kebocoran bangunan.','Periksa pipa terbuka, korosi, dan perangkat dosing.','Tinjau area yang berpotensi menjadi tempat pertumbuhan mikroba.'],{specialist:true});
  many('plumbing','quarterly',['Periksa genangan dan penyebab saluran tidak lancar.','Verifikasi perangkat deteksi kebocoran dan proteksi aliran balik.'],{specialist:true});
  add('plumbing','yearly','Catat hasil inspeksi dan pengujian bejana tekan oleh personel kompeten.',{specialist:true,method:'Verifikasi laporan teknis'});
  many('lift','weekly',['Periksa fungsi pintu dan keselarasan kabin terhadap lantai.','Periksa ventilasi, lampu biasa, dan lampu darurat.']);
  many('lift','monthly',['Verifikasi komunikasi darurat dan fungsi kembali ke lantai aman.','Catat pemeriksaan panel dan peralatan ruang mesin.'],{specialist:true});
  many('lift','yearly',['Tinjau sertifikasi keselamatan dan hasil pengujian kecepatan lift.','Catat pemeriksaan, penyetelan, pelumasan, dan kalibrasi oleh teknisi.','Verifikasi pemeriksaan pengawatan, panel kontrol, dan sirkuit listrik.'],{specialist:true,method:'Verifikasi laporan teknis'});
  many('floor','monthly',['Periksa kebersihan dan kerusakan permukaan lantai.','Periksa lubang kabel atau pipa yang terbuka dan bahaya tersandung.']);
  many('floor','yearly',['Periksa kestabilan, sambungan penutup, dan keausan lantai.','Verifikasi hasil pemeriksaan pembumian lantai.'],{specialist:true});
  many('bms','daily',['Periksa sensor yang terlihat untuk memastikan tidak ada kerusakan atau penghalang.','Periksa log kesalahan.'],{user:true});
  add('bms','daily','Cadangkan berkas log.',{user:true,method:'Pelaksanaan / verifikasi pencadangan',criterion:'Cadangan berkas log berhasil dibuat sesuai prosedur yang berlaku.'});
  many('bms','monthly',['Bandingkan pembacaan lokal dengan konsol.','Verifikasi cadangan konfigurasi dan sinkronisasi waktu.','Tinjau akses pengguna serta integritas sambungan kabel.']);
  many('bms','quarterly',['Tinjau kebutuhan pembaruan perangkat lunak dan pengaturan set point.','Periksa kebersihan sistem, konsol, dan pengawatannya.'],{specialist:true});
  many('bms','yearly',['Verifikasi inspeksi dan kalibrasi sensor sesuai kebutuhan OEM.','Periksa label serta rambu sistem.'],{specialist:true});
  add('cctv','daily','Periksa kualitas gambar kamera.',{user:true,applies:['camera','system'],criterion:'Gambar setiap kamera terdaftar dapat digunakan untuk pengawasan sesuai kriteria visual lokasi.'});
  add('cctv','daily','Periksa log kesalahan sistem CCTV.',{user:true,applies:['recorder','system']});
  add('cctv','daily','Periksa perangkat perekam video, meliputi kualitas rekaman, ruang penyimpanan yang tersedia, dan kondisi lingkungannya.',{user:true,applies:['recorder','system']});
  many('cctv','monthly',['Periksa cakupan sudut pandang kamera.','Verifikasi fungsi pan, tilt, dan zoom bila tersedia.','Periksa kepekaan deteksi gerak bila tersedia.'],{applies:['camera','system']});
  many('cctv','monthly',['Verifikasi mutu rekaman dan cadangannya.','Periksa sinkronisasi waktu serta hak akses pengguna.'],{applies:['recorder','system']});
  add('cctv','monthly','Tinjau keterbacaan tampilan monitor untuk pengawasan.',{applies:['monitor'],site:true});
  many('cctv','quarterly',['Catat inspeksi kebersihan kamera dan kebutuhan pembersihan.','Periksa kondisi pengawatan kamera.'],{applies:['camera','system'],specialist:true});
  add('cctv','quarterly','Catat pemeriksaan dan pembersihan perangkat perekam.',{applies:['recorder','system'],specialist:true});
  add('cctv','yearly','Periksa kekuatan pemasangan kamera.',{applies:['camera','system'],specialist:true});
  add('cctv','yearly','Verifikasi sambungan listrik perangkat perekam.',{applies:['recorder','system'],specialist:true});
  add('cctv','yearly','Periksa distorsi dan bekas gambar pada monitor.',{applies:['monitor','system']});
  add('cctv','yearly','Periksa label serta rambu CCTV.');
  many('access','daily',['Periksa log kesalahan.','Periksa log kejadian, termasuk catatan percobaan akses masuk yang tidak valid.','Periksa status kesiapan sistem pengunci bermotor atau magnetik.'],{user:true});
  many('access','monthly',['Periksa sinkronisasi waktu perangkat.','Verifikasi fungsi deteksi pintu terbuka dan pembobolan.'],{specialist:true});
  many('access','quarterly',['Periksa pengawatan, catu daya, dan baterai cadangan.'],{specialist:true});
  many('access','yearly',['Periksa pemasangan fisik serta sambungan peralatan kontrol.','Tinjau firmware, label, dan rambu.'],{specialist:true});
  many('fire','daily',['Periksa jalur evakuasi: bebas hambatan, pintu dapat dibuka dan ditutup, rambu terlihat, dan penerangan berfungsi.','Pastikan panel alarm kebakaran menunjukkan status normal.','Pastikan seluruh peralatan keselamatan kebakaran berada di tempatnya, terlihat, dan mudah diakses, termasuk sirene, rambu, APAR, dan akses hidran.'],{user:true});
  many('fire','monthly',['Catat uji fungsi perangkat panggil, pemberitahuan, dan pelepas pintu.','Periksa pintu tahan api, APAR, hidran, dan perlengkapan pernapasan.','Periksa persediaan air darurat; verifikasi EPO hanya sesuai MOP berizin.'],{specialist:true,method:'Verifikasi laporan / inspeksi berizin'});
  many('fire','quarterly',['Periksa lampu darurat dan baterai panel.','Periksa sprinkler, nozzle, dan komponen sistem pemadaman alternatif.'],{specialist:true});
  add('fire','yearly','Tinjau laporan pemeliharaan tahunan dan kewajiban pemeriksaan sistem kebakaran.',{site:true,specialist:true,method:'Verifikasi dokumen OEM / peraturan'});
  add('fuel','daily','Periksa kebocoran dan kerusakan yang terlihat secara langsung.',{user:true});
  many('fuel','weekly',['Periksa indikator deteksi kebocoran, pompa, selang, dan sambungan.','Periksa korosi pipa, kondisi penampung tumpahan, indikator isi, dan rambu.']);
  many('fuel','monthly',['Periksa retak penampung, kebocoran tangki, dan indikasi air di dalamnya.','Verifikasi deteksi kebocoran serta kondisi nozzle, selang, dan fitting.','Periksa kondisi motor pompa dan rambu.'],{specialist:true});
  many('fuel','yearly',['Periksa struktur penyangga, kondisi badan tangki, dan dispenser.','Verifikasi pembumian dan kondisi filter.','Catat pemeriksaan mutu bahan bakar terhadap kontaminasi mikroba.'],{specialist:true});
  add('generator','daily','Periksa tingkat bahan bakar.',{user:true});
  add('generator','daily','Periksa dan catat tingkat serta tekanan oli, serta suhu air atau cairan pendingin.',{user:true,measurement:true,method:'Pembacaan dan pencatatan indikator'});
  many('generator','daily',['Periksa adanya kebocoran.','Periksa status panel kontrol.'],{user:true});
  many('generator','monthly',['Periksa getaran, suara, dan kekuatan pemasangan.','Periksa pendingin, starter, pengisi daya, serta baterai.','Catat pemeriksaan kondensat buang dan indikator.'],{specialist:true});
  many('generator','quarterly',['Catat hasil pengukuran parameter listrik.','Periksa sabuk, bagian bergerak, saluran buang, dan pelumasannya.','Periksa saluran udara, filter, selang, dan radiator.'],{specialist:true});
  many('generator','yearly',['Periksa filter; verifikasi kalibrasi instrumen ukur.','Periksa sambungan, pengawatan, isolasi, dan pembumian.','Catat uji shunt trip, kontak monitoring, dan termografi berbeban.'],{specialist:true,method:'Verifikasi laporan teknis'});
  add('transformer','daily','Periksa suhu transformator.',{user:true,measurement:true});
  many('transformer','daily',['Periksa adanya suara dan getaran yang tidak normal.','Periksa adanya kebocoran.'],{user:true});
  add('transformer','monthly','Tinjau tren catatan inspeksi dan jadwal layanan transformator.',{site:true,method:'Tinjauan catatan'});
  many('transformer','quarterly',['Periksa kondisi fisik, pernapasan, bushing, dan indikator oli.'],{specialist:true});
  many('transformer','yearly',['Verifikasi kalibrasi meter, kondisi fisik, label, dan kipas.','Tinjau analisis gas terlarut dan kondisi oli bila sesuai teknologi aset.','Catat pemeriksaan relai, pelepas tekanan, dan termografi.'],{specialist:true,method:'Verifikasi laporan teknis'});
  many('power','monthly',['Periksa kebersihan bagian yang diizinkan dan tampilan indikator.']);
  many('power','quarterly',['Verifikasi pembumian, label, penutup, pengunci, interlock, dan meter.'],{specialist:true});
  many('power','yearly',['Periksa kabinet, isolasi, kabel, busbar, dan koneksi terminal.','Catat termografi dan pengujian pemutus, kontak, serta pembumian.','Verifikasi setelan relai, kalibrasi meter, dan bagian bergerak.'],{specialist:true,method:'Verifikasi laporan teknis'});
  many('ups','daily',['Periksa kebersihan UPS.','Periksa indikasi alarm pada panel pemantauan UPS dan baterai.','Periksa suhu serta adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.'],{user:true});
  many('ups','monthly',['Catat pemeriksaan kebocoran, pembengkakan, dan tegangan baterai.','Tinjau sumber suara yang tidak biasa.'],{specialist:true});
  many('ups','quarterly',['Periksa kipas, filter, indikator, serta penutup keselamatan.','Periksa kapasitor, baterai, pengawatan, dan konektor.'],{specialist:true});
  many('ups','yearly',['Catat termografi dan verifikasi kemampuan transfer/bypass sesuai MOP.','Verifikasi kalibrasi instrumen serta hasil pengukuran parameter DC.','Periksa kontak, sambungan baterai/terminal, dan fungsi paralel.'],{specialist:true,method:'Verifikasi laporan teknis'});
  add('dynamic','daily','Periksa tingkat bahan bakar.',{user:true});
  add('dynamic','daily','Periksa dan catat tingkat serta tekanan oli, serta suhu air atau cairan pendingin.',{user:true,measurement:true,method:'Pembacaan dan pencatatan indikator'});
  many('dynamic','daily',['Periksa status panel kontrol.','Periksa adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.'],{user:true});
  many('dynamic','monthly',['Periksa pemasangan, pendingin, starter, pengisi daya, dan baterai.','Catat pemeriksaan kondensat buang serta indikator.'],{specialist:true});
  many('dynamic','quarterly',['Catat parameter listrik dan pemeriksaan bagian bergerak.','Periksa sabuk, saluran buang, saluran udara, selang, dan radiator.'],{specialist:true});
  many('dynamic','yearly',['Periksa filter dan verifikasi kalibrasi instrumen.','Periksa pengawatan, isolasi, pemasangan, serta pembumian.'],{specialist:true});
  many('chiller','daily',['Pastikan seluruh peralatan beroperasi dan sistem keselamatan terpasang serta siap digunakan.','Periksa nilai pengaturan (set point).','Periksa panel kontrol dan panel alarm.','Periksa pembacaan parameter air suplai, air balik, dan laju aliran air.','Periksa adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.','Periksa tingkat oli kompresor sesuai teknologi yang digunakan, serta adanya kebocoran oli.'],{user:true});
  many('chiller','monthly',['Catat inspeksi evaporator, kondensor, motor, dan pompa.','Periksa mutu air, isolasi, sambungan pipa, dan kendali.','Catat konsumsi daya serta kondisi oli kompresor.'],{specialist:true});
  many('chiller','yearly',['Tinjau pengujian dan pembersihan tabung kondensor/evaporator.','Periksa kompresor, rangkaian listrik, kontak monitoring, dan refrigeran.'],{specialist:true,method:'Verifikasi laporan teknis'});
  many('tower','daily',['Pastikan seluruh peralatan beroperasi dan sistem keselamatan terpasang serta siap digunakan.','Periksa aliran air.','Periksa panel kontrol dan panel alarm.','Periksa adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.'],{user:true});
  many('tower','weekly',['Catat pembersihan saringan dan pemeriksaan mutu air.','Periksa suplai pengganti, kipas, pompa, sambungan, serta sabuk.'],{specialist:true});
  many('tower','monthly',['Periksa blowdown, bahan kimia, penyangga motor, dan bilah kipas.','Periksa keselarasan motor, kopling, serta drift eliminator.'],{specialist:true});
  many('tower','quarterly',['Periksa sabuk, puli, pelumasan, dan nozzle.','Catat konsumsi daya komponen.'],{specialist:true});
  many('tower','yearly',['Catat inspeksi bilah kipas, saringan, dan gear reducer.','Catat inspeksi dek, fill, motor, serta perangkat keselamatan getaran.'],{specialist:true,method:'Verifikasi laporan teknis'});
  many('hvac','daily',['Periksa nilai pengaturan suhu dan kelembapan.','Periksa adanya penghalang pada saluran udara masuk dan keluar.','Periksa adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.'],{user:true});
  many('hvac','monthly',['Periksa kipas serta debu, kotoran, atau kebocoran.','Catat temperatur dan aliran suplai chilled water bila tersedia.'],{specialist:true});
  many('hvac','quarterly',['Periksa filter, coil, drainase, dan sistem humidifikasi.','Periksa bagian bergerak, sabuk, refrigeran, serta hubungan ke proteksi kebakaran.','Catat parameter listrik sesuai prosedur.'],{specialist:true});
  many('hvac','yearly',['Periksa pipa, katup, isolasi, drainase, dan damper.','Verifikasi kalibrasi sensor serta kondisi sistem listrik.'],{specialist:true});
  const subtypes={system:'Sistem / area lengkap',camera:'Kamera',recorder:'Perekam NVR / DVR',monitor:'Monitor CCTV',ats:'ATS',pdu:'PDU',switchgear:'Panel / switchgear'};
  const demoLocations={
    facility:'Area Fasilitas',plumbing:'Area Plumbing',lift:'Area Lift',floor:'Data Hall',
    bms:'Ruang Monitoring',cctv:'Area Keamanan',access:'Akses Masuk',fire:'Zona Proteksi Kebakaran',
    fuel:'Area Tangki BBM',generator:'Ruang Generator',transformer:'Area Transformer',
    power:'Ruang Kelistrikan',ups:'Ruang UPS',dynamic:'Ruang Dynamic UPS',chiller:'Area Chiller',
    tower:'Area Cooling Tower',hvac:'Data Hall'
  };
  const assets=categories.map(c=>({id:`demo-${c.id}`,code:`DEMO-${c.id.toUpperCase()}-01`,name:c.id==='cctv'?'Kamera koridor A (contoh)':`${c.name} 01 (contoh)`,category:c.id,subtype:c.id==='cctv'?'camera':'system',location:`${demoLocations[c.id]} DEMO 01`,manufacturer:'',model:'',responsible:'',active:true}));
  assets.push({id:'demo-cctv-2',code:'DEMO-CAM-02',name:'Kamera pintu masuk (contoh)',category:'cctv',subtype:'camera',location:'Pintu masuk',active:true},
  {id:'demo-nvr',code:'DEMO-NVR-01',name:'Perekam NVR 01 (contoh)',category:'cctv',subtype:'recorder',location:'Ruang keamanan',active:true},
  {id:'demo-monitor',code:'DEMO-MON-01',name:'Monitor CCTV 01 (contoh)',category:'cctv',subtype:'monitor',location:'Ruang keamanan',active:true},
  {id:'demo-pdu',code:'DEMO-PDU-01',name:'PDU rak A (contoh)',category:'power',subtype:'pdu',location:'Ruang server',active:true});
  const extraDemoAssets=[];
  for (const category of categories) {
    const existing=assets.filter(asset=>asset.category===category.id);
    for (let unit=existing.length+1;unit<=5;unit++) {
      const number=String(unit).padStart(2,'0');
      let subtype='system', name=`${category.name} ${number} (contoh)`;
      if (category.id==='cctv') {subtype='camera';name=`Kamera area ${number} (contoh)`;}
      if (category.id==='power') {
        subtype={3:'ats',4:'switchgear',5:'pdu'}[unit];
        name=`${subtypes[subtype]} ${number} (contoh)`;
      }
      extraDemoAssets.push({
        id:`demo-extra-${category.id}-${number}`,code:`DEMO-${category.id.toUpperCase()}-${number}`,
        name,category:category.id,subtype,location:`${demoLocations[category.id]} DEMO ${number}`,
        manufacturer:'',model:'',responsible:'',active:true
      });
    }
  }
  assets.push(...extraDemoAssets);
  const demoExamples={
    facility:[['Toilet','Area Toilet'],['Ruang Janitor','Ruang Janitor'],['Koridor Utama','Koridor Utama'],['Area Data Hall','Data Hall'],['Lobi','Lobi Gedung']],
    plumbing:[['Jaringan Plumbing Toilet','Area Toilet'],['Jaringan Plumbing Janitor','Ruang Janitor'],['Jaringan Plumbing Pantry','Pantry'],['Jaringan Plumbing Utilitas A','Area Utilitas A'],['Jaringan Plumbing Utilitas B','Area Utilitas B']],
    lift:[['Lift Penumpang A','Lobi A'],['Lift Penumpang B','Lobi B'],['Lift Barang A','Area Bongkar Muat A'],['Lift Barang B','Area Bongkar Muat B'],['Lift Servis','Area Servis']],
    floor:[['Raised Floor Data Hall A','Data Hall A'],['Raised Floor Data Hall B','Data Hall B'],['Raised Floor Ruang Network','Ruang Network'],['Raised Floor Ruang UPS','Ruang UPS'],['Raised Floor Ruang Monitoring','Ruang Monitoring']],
    bms:[['EMS/BMS Data Hall A','Data Hall A'],['EMS/BMS Data Hall B','Data Hall B'],['EMS/BMS Ruang UPS','Ruang UPS'],['EMS/BMS Ruang Kelistrikan','Ruang Kelistrikan'],['EMS/BMS Area Cooling','Area Cooling']],
    cctv:[['CCTV Ruang Panel','Ruang Panel'],['CCTV Ruang A','Ruang A'],['NVR Ruang Keamanan','Ruang Keamanan'],['Monitor CCTV Ruang Keamanan','Ruang Keamanan'],['CCTV Ruang B','Ruang B']],
    access:[['Access Control Pintu Utama','Pintu Masuk Utama'],['Access Control Data Hall A','Pintu Data Hall A'],['Access Control Data Hall B','Pintu Data Hall B'],['Access Control Ruang Panel','Pintu Ruang Panel'],['Access Control Ruang Network','Pintu Ruang Network']],
    fire:[['Fire Safety Data Hall A','Zona Data Hall A'],['Fire Safety Data Hall B','Zona Data Hall B'],['Fire Safety Ruang UPS','Zona Ruang UPS'],['Fire Safety Ruang Generator','Zona Ruang Generator'],['Fire Safety Area Kantor','Zona Kantor']],
    fuel:[['Tangki BBM Utama A','Area Tangki Utama A'],['Tangki BBM Utama B','Area Tangki Utama B'],['Tangki BBM Generator A','Area Generator A'],['Tangki BBM Generator B','Area Generator B'],['Tangki BBM Cadangan','Area Tangki Cadangan']],
    generator:[['Generator Set Gedung A','Ruang Generator A'],['Generator Set Gedung B','Ruang Generator B'],['Generator Set Data Hall A','Area Generator Data Hall A'],['Generator Set Data Hall B','Area Generator Data Hall B'],['Generator Set Cadangan','Ruang Generator Cadangan']],
    transformer:[['Transformer Incoming A','Gardu Incoming A'],['Transformer Incoming B','Gardu Incoming B'],['Transformer Data Hall A','Gardu Data Hall A'],['Transformer Data Hall B','Gardu Data Hall B'],['Transformer Utilitas','Gardu Utilitas']],
    power:[['Sistem Distribusi Daya Gedung A','Ruang Panel Utama'],['PDU Rak A','Data Hall A · Rak A'],['ATS Generator A','Ruang Panel Generator'],['Switchgear Incoming B','Ruang Panel Incoming B'],['PDU Rak B','Data Hall B · Rak B']],
    ups:[['Static UPS Data Hall A','Ruang UPS A'],['Static UPS Data Hall B','Ruang UPS B'],['Static UPS Ruang Network','Ruang UPS Network'],['Static UPS Ruang Monitoring','Ruang UPS Monitoring'],['Static UPS Cadangan','Ruang UPS Cadangan']],
    dynamic:[['Dynamic UPS Gedung A','Ruang Dynamic UPS A'],['Dynamic UPS Gedung B','Ruang Dynamic UPS B'],['Dynamic UPS Data Hall A','Area Dynamic UPS Data Hall A'],['Dynamic UPS Data Hall B','Area Dynamic UPS Data Hall B'],['Dynamic UPS Cadangan','Area Dynamic UPS Cadangan']],
    chiller:[['Chiller Data Hall A','Chiller Plant A'],['Chiller Data Hall B','Chiller Plant B'],['Chiller Gedung Utilitas','Chiller Plant Utilitas'],['Chiller Ruang Network','Chiller Plant Network'],['Chiller Cadangan','Chiller Plant Cadangan']],
    tower:[['Cooling Tower Chiller A','Area Cooling Tower A'],['Cooling Tower Chiller B','Area Cooling Tower B'],['Cooling Tower Chiller Utilitas','Area Cooling Tower Utilitas'],['Cooling Tower Chiller Network','Area Cooling Tower Network'],['Cooling Tower Cadangan','Area Cooling Tower Cadangan']],
    hvac:[['CRAC Data Hall A','Data Hall A'],['CRAC Data Hall B','Data Hall B'],['PAC Ruang Panel','Ruang Panel'],['CRAH Ruang Network','Ruang Network'],['PAC Ruang Monitoring','Ruang Monitoring']]
  };
  const demoAssetRenames=[];
  for (const [categoryIndex,category] of categories.entries()) {
    assets.filter(asset=>asset.category===category.id).forEach((asset,index)=>{
      const [name,location]=demoExamples[category.id][index];
      const previousLocations=[asset.location,`Zona Demo ${String(index+1).padStart(2,'0')}`];
      if (index===0) previousLocations.push(['Area utilitas','Ruang pendukung','Area gedung','Ruang server'][categoryIndex%4]);
      demoAssetRenames.push({id:asset.id,code:asset.code,category:asset.category,subtype:asset.subtype,
        previousName:asset.name,previousLocations,name,location:`${location} (DEMO)`});
      asset.name=name;
      asset.location=`${location} (DEMO)`;
    });
  }
  root.DCIData={periods,categories,rules,assets,extraDemoAssets,demoAssetVersion:'demo-five-per-category-v1',demoAssetRenames,demoAssetNamingVersion:'demo-functional-names-v1',formalLabel,subtypes,version:'2026-11-04.2',dailyParameterVersion:'2026-11-04.daily-id.1',sourceOverview:'https://www.epi-ap.com/dcos-standard/page/72/783'};
})(typeof window!=='undefined'?window:globalThis);
