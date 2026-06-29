(function(){
  var T = window.LV_I18N || {};
  function $(id){return document.getElementById(id);}
  function set(id,val,cls){var e=$(id); if(!e)return; e.textContent=val; e.className='lvval'+(cls?' '+cls:'');}
  try{ set('lv-tzb', Intl.DateTimeFormat().resolvedOptions().timeZone || T.na); }catch(e){ set('lv-tzb', T.na); }
  function geo(){
    ['lv-ip','lv-geo','lv-isp','lv-tzi'].forEach(function(i){set(i,T.checking);});
    var hint=$('lv-tzhint'); if(hint) hint.textContent='';
    function done(ip,loc,isp,tzi){
      set('lv-ip',ip||T.na); set('lv-geo',loc||T.na); set('lv-isp',isp||T.na); set('lv-tzi',tzi||T.na);
      try{var b=Intl.DateTimeFormat().resolvedOptions().timeZone; if(tzi&&b&&tzi!==b&&hint) hint.textContent=T.mismatch_tz;}catch(e){}
    }
    fetch('https://ipwho.is/',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){
      if(!d||d.success===false) throw 0;
      done(d.ip,[d.city,d.region,d.country].filter(Boolean).join(', '),(d.connection&&d.connection.isp)||d.org,(d.timezone&&(d.timezone.id||d.timezone)));
    }).catch(function(){
      fetch('https://ipapi.co/json/').then(function(r){return r.json();}).then(function(d){
        done(d.ip,[d.city,d.region,d.country_name].filter(Boolean).join(', '),d.org,d.timezone);
      }).catch(function(){ done('','','',''); });
    });
  }
  function webrtc(){
    var box=$('lv-webrtc'), verdict=$('lv-webrtc-verdict'), found={};
    if(verdict){verdict.textContent=T.checking;verdict.className='lvval';}
    var RTC=window.RTCPeerConnection||window.webkitRTCPeerConnection||window.mozRTCPeerConnection;
    if(!RTC){ if(verdict){verdict.textContent=T.na;} return; }
    function classify(ip){
      if(/\.local$/i.test(ip)) return 'mdns';
      if(/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|127\.|f[cde]|fe80)/i.test(ip)) return 'local';
      return 'public';
    }
    function render(){
      var ips=Object.keys(found); if(!ips.length) return;
      if(box) box.innerHTML=ips.map(function(i){return '<code>'+i+'</code><span class="lv-tag lv-'+found[i]+'">'+(T['rtc_'+found[i]]||found[i])+'</span>';}).join('<br>');
      var pub=ips.filter(function(i){return found[i]==='public';}), loc=ips.filter(function(i){return found[i]==='local';});
      if(!verdict) return;
      if(pub.length){verdict.textContent=T.leak_public;verdict.className='lvval bad';}
      else if(loc.length){verdict.textContent=T.leak_local;verdict.className='lvval warn';}
      else{verdict.textContent=T.ok_safe;verdict.className='lvval good';}
    }
    try{
      var pc=new RTC({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
      pc.createDataChannel('x');
      pc.onicecandidate=function(e){
        if(!e||!e.candidate||!e.candidate.candidate){render();return;}
        var m=e.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})|([a-f0-9]{0,4}:[a-f0-9:]+)/i);
        if(m){var ip=m[0]; if(ip&&!found[ip]){found[ip]=classify(ip);} render();}
      };
      pc.createOffer().then(function(o){return pc.setLocalDescription(o);}).catch(function(){});
      setTimeout(function(){ if(!Object.keys(found).length&&verdict){verdict.textContent=T.ok_safe;verdict.className='lvval good';} render(); },3000);
    }catch(e){ if(verdict) verdict.textContent=T.na; }
  }
  function run(){ geo(); webrtc(); }
  var b=$('lv-rerun'); if(b) b.addEventListener('click',run);
  run();
})();
