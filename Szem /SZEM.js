function stop(){
	var x = setTimeout('',100); for (var i = 0 ; i < x ; i++) clearTimeout(i);
}
stop(); /*Időstop*/
document.getElementsByTagName("html")[0].setAttribute("class","");

function loadXMLDoc(dname) {
	if (window.XMLHttpRequest) xhttp=new XMLHttpRequest();
		else xhttp=new ActiveXObject("Microsoft.XMLHTTP");
	xhttp.open("GET",dname,false);
	xhttp.send();
	return xhttp.responseXML;
}

if (typeof(AZON)!="undefined") { alert("Itt már fut SZEM. \n Ha ez nem igaz, nyitsd meg új lapon a játékot, és próbáld meg ott futtatni"); exit();}
var VERZIO = 'v4.6 Build 23.11.13';
var SZEM4_SETTINGS = {
	selectedProfile: 1,
	profile1: {},
	profile2: {},
	profile3: {},
	profile4: {}
};
var TIME_ZONE = 0;
try{ /*Rendszeradatok*/
	var AZON="S0";
	if (window.name.indexOf(AZON)>-1) AZON="S1";
	var BASE_URL=document.location.href.split("game.php")[0];
	var CONFIG=loadXMLDoc(BASE_URL+"interface.php?func=get_config");

	var SPEED=parseFloat(CONFIG.getElementsByTagName("speed")[0].textContent);
	var UNIT_S=parseFloat(CONFIG.getElementsByTagName("unit_speed")[0].textContent);
	
	var MOBILE_MODE = false;
	var ALL_EXTENSION = [];

	var KTID={}, /*Koord-ID párosok*/
		ID_TO_INFO = {}, /*ID: name: falunév, point: pont, pop: tanya párosok*/
		TERMELES=[5,30,35,41,47,55,64,74,86,100,117,136,158,184,214,249,289,337,391,455,530,616,717,833,969,1127,1311,1525,1774,2063,2400],
		UNITS=["spear","sword","axe","archer","spy","light","marcher","heavy"],
		TEHERARR=[25,15,10,10,0,80,50,50];
	if (parseFloat(CONFIG.getElementsByTagName("archer")[0].textContent) == 0) {
		let index = UNITS.findIndex(el => el.includes("archer"));
		UNITS.splice(index, 1);
		TEHERARR.splice(index, 1);
		index = UNITS.findIndex(el => el.includes("marcher"));
		UNITS.splice(index, 1);
		TEHERARR.splice(index, 1);
	}
	var TEHER = {
		spear: 25,
		sword: 15,
		axe: 10,
		archer: 10,
		spy: 0,
		light: 80,
		marcher: 50,
		heavy: 50
	},
	TANYAARR=[1,1,1,1,2,4,5,6],
	TANYA = {
		spear: 1,
		sword: 1,
		axe: 1,
		archer: 1,
		spy: 2,
		light: 4,
		marcher: 5,
		heavy: 6
	},
	E_SEB_ARR=[18,22,18,18,9,10,10,11],
	E_SEB = {
		spear: 18,
		sword: 22,
		axe: 18,
		archer: 18,
		spy: 9,
		light: 10,
		marcher: 10,
		heavy: 11
	};

	var VILL1ST="";
	var MAX_IDO_PERC = 20; // shorttest-be van felülírva!!!
	AZON=game_data.player.id+"_"+game_data.world+AZON;
	var CLOUD_AUTHS = localStorage.getItem('szem_firebase');
	var USER_ACTIVITY = true;
	var USER_ACTIVITY_TIMEOUT;
	var worker = createWorker(function(self){
		self.TIMERS = {};
		self.addEventListener("message", function(e) {
			if (e.data.id == 'stopTimer') {
				clearTimeout(self.TIMERS[e.data.value]);
			} else {
				self.TIMERS[e.data.id] = setTimeout(() => { postMessage(e.data); }, e.data.time);
			}
		}, false);
	});
	worker.onmessage = function(worker_message) {
		worker_message = worker_message.data;
		switch(worker_message.id) {
			case 'farm': szem4_farmolo_motor(); break;
			case 'vije': szem4_VIJE_motor(); break;
			case 'epit': szem4_EPITO_motor(); break;
			case 'adatok': szem4_ADAT_motor(); break;
			case 'gyujto': szem4_GYUJTO_motor(); break;
			case 'norbi0n_farm': szem4_norbi0n_farm_motor(); break;
			case 'recruitment': szem4_recruitment_motor(); break;
			case 'barb': szem4_barb_motor(); break;
			default: debug('worker','Ismeretlen ID', JSON.stringify(worker_message))
		}
	};
	
	// Listen for bot detection messages from farm tab
	window.addEventListener('message', (event) => {
		if (event.data && event.data.source === 'norbi_farm_bot_detection') {
			debug('Norbi0N_Farm', '🚨 Received bot detection message from farm tab');
			BotvedelemBe();
		}
	});
	
	function createWorker(main){
		var blob = new Blob(
			["(" + main.toString() + ")(self)"],
			{type: "text/javascript"}
		);
		return new Worker(window.URL.createObjectURL(blob));
	}
}catch(e){alert('SZEM Nem tud elindulni/n' + e); exit(0);}

function init(){try{
	getServerTime(window, true);
	if (document.getElementById("production_table")) var PFA=document.getElementById("production_table"); else 
	if (document.getElementById("combined_table")) var PFA=document.getElementById("combined_table"); else 
	if (document.getElementById("buildings_table")) var PFA=document.getElementById("buildings_table"); else 
	if (document.getElementById("techs_table")) var PFA=document.getElementById("techs_table");
	else {
		alert("Ilyen nézetbe való futtatás nem támogatott. Kísérlet az áttekintés betöltésére...\n\nLaunching from this view is not supported. Trying to load overview...");
		document.location.href = document.location.href.replace(/screen=[a-zA-Z]+/g,"screen=overview_villages");
		return false;
	}
	if (document.querySelectorAll('#paged_view_content .group-menu-item').length > 0) {
		let isError = false;
		document.querySelectorAll('#paged_view_content .group-menu-item').forEach(e => {
			if (e.href && e.href.includes('group=0')) {
				alert('Ebben a nézetben nem látszódik minden falud, mert csoportra vagy szűrve. SZEM csak azon falukat ismeri ami lát is, így biztosítsd a teljes listát. Kíéslet az átirányításra...');
				document.location.href = e.href;
				isError = true;
			}
		});
		if (isError) return false;
	}
	if (document.querySelectorAll('#paged_view_content .paged-nav-item').length > 0) {
		let isError = false;
		document.querySelectorAll('#paged_view_content .paged-nav-item').forEach(e => {
			if (e.href && e.href.includes('page=-1')) {
				alert('Ebben a nézetben nem látszódik minden falud, mert a lapozhatóság elrejti. SZEM csak azon falukat ismeri ami lát is, így biztosítsd a teljes listát. Kíéslet az átirányításra...');
				document.location.href = e.href;
				isError = true;
			}
		});
		if (isError) return false;
	}

	var faluNevOszlopNo = -1,
		faluPontOszlopNo = -1,
		faluTanyaOszlopNo = -1;
	for (let i=0;i<PFA.rows[0].cells.length;i++) {
		let linkText = PFA.rows[0].cells[i].querySelector('a');
		if (linkText) linkText = linkText.href; else continue;
		if (linkText.includes('order=name')) faluNevOszlopNo=i;
		if (linkText.includes('order=points')) faluPontOszlopNo=i;
		if (linkText.includes('order=pop')) faluTanyaOszlopNo=i;
	}
	if (faluNevOszlopNo == -1) {
		alert("Nem találok koordinátákat ebbe a listába.\n\nI can not find coordinates in this view.");
		return false;
	}
	if (faluPontOszlopNo == -1) {
		alert("Nem találok pontokat ebbe a listába a falukhoz.\n\nI can not find points for villages in this view.");
		return false;
	}
	if (faluTanyaOszlopNo == -1) {
		alert("Nem találok népességmutatót ebbe a listába a falukhoz.\n\nI can not find farm states for villages in this view.");
		return false;
	}

	VILL1ST=PFA.rows[1].cells[faluNevOszlopNo].getElementsByTagName("a")[0].href;
	for (var i=1;i<PFA.rows.length;i++) {
		let kord=PFA.rows[i].cells[faluNevOszlopNo].textContent.match(/[0-9]+(\|)[0-9]+/g);
		kord=kord[kord.length-1];
		let faluId = PFA.rows[i].cells[faluNevOszlopNo].getElementsByTagName("span")[0].getAttribute("data-id").match(/[0-9]+/g)[0] 
		KTID[kord] = faluId;

		let faluNev = PFA.rows[i].cells[faluNevOszlopNo].getElementsByTagName("span")[0].textContent.trim().split(' ');
		faluNev.pop();
		faluNev.pop();

		let faluPont = PFA.rows[i].cells[faluPontOszlopNo].textContent.trim();
		let faluPop = PFA.rows[i].cells[faluTanyaOszlopNo].textContent.trim();
		ID_TO_INFO[faluId] = {
			name: faluNev.join(' '),
			point: faluPont,
			pop: faluPop
		}
	}
	const szemStyle = `
		body { background: #111; scrollbar-width: none; padding-bottom: 0; }
		body::-webkit-scrollbar { width: 0; }
		#content > table { box-shadow: 0 0 12px black; min-height: 100vh; }
		#side-notification-container {
			pointer-events: none;
			display: none;
		}
		*[onclick] {
			cursor: pointer;
		}
		#alert2 {
			width: 300px;
			background-color: #0d47a1;
			color: #FFF;
			position: fixed;
			left:40%;
			top:40%;
			font-size: 11pt;
			padding: 5px;
			z-index: 200;
			border-radius: 5px;
			box-shadow: black 0 0 7px;
			display: none;
			animation: blinkingalert 0.5s infinite;
		}
		@keyframes blinkingalert {
			0% {
				box-shadow: #0d47a1 0 0 0px;
			}
			100% {
				box-shadow: #0d47a1 0 0 20px;
			}
		}
		#alert2head {
			display: flex;
			justify-content: space-between;
			width: 100%;
			cursor: all-scroll;
			background: rgba(255,255,255,0.1);
			margin: -5px;
			padding: 5px;
			font-weight: bold;
			height: 20px;
		}
		#alert2head a {
			padding: 10px 0 10px 10px;
		}
		#kiegs img {
			cursor: pointer;
		}
		#content {
			width: 1024px;
			margin: auto;
			position: relative;
			z-index: 2;
		}
		.fej {
			width: 1024px;
			margin: auto;
			color: white;
			position: relative;
			box-shadow: 0 0 12px black;
			z-index: 3;
		}
		.fej a {
			color: white;
		}
		.fej > table {
			padding:1px;
			border: 1px solid yellow;
		}
		#global_notifications {
			position: absolute;
			top: 0;
			left: -22px;
			width: 18px;
		}
		#debugger {
			table-layout: fixed;
			width: 100%;
		}
		#debugger td, #debugger th {
			word-wrap: break-word;
			max-width: 100%;
		}
		#global_notifications img { width: 18px; }
		#global_notifications img.rotate { animation: rotation 2s infinite linear; }
		@keyframes rotation {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}
		table.menuitem {
			vertical-align:top;
			text-align: top;
			padding: 20px;
			margin:auto;
			color: white;
			border: 1px solid yellow;
		}
		table.menuitem > tbody > tr > td {
			padding: 0px;
			vertical-align:top;
		}
		table td {
			padding: 0px;
			vertical-align:middle;
		}
		table {
			padding: 0px;
			margin: auto;
			color: white;
		}
		table.vis { color:black; }
		table.vis td, table.vis th { padding: 3px 6px 3px 6px; }
		#farm_hova > tbody > tr > td:last-child {
			width: 135px;
		}
		textarea {
			background-color: #020;
			color:white;
		}
		.divrow { display: flex; align-items: center; }
		.divcell {
			display: table-cell;
			text-align: center;
			vertical-align:top;
		}
		a { color: white; }
		img{
			border-color: grey;
			padding:1px;
		}
		#naploka a { color:blue; }
		input[type="button"] {
			font-size:13px;
			font-family: Century Gothic, sans-serif;
			color:#FFFF77;
			background-color:#3366CC;
			border-style: ridge;
			border-color:#000000;
			border-width:3px;
		}
		#adat_opts tr td,
		#adat_opts tr th {
			text-align: center;
			vertical-align: middle;
		}
		.profileselector {
			display: flex;
			justify-content: center;
		}
		.profileselector .profile {
			background: white;
			border: 1px solid transparent;
			color: black;
			padding: 10px;
			margin: 5px;
			cursor: pointer;
		}
		.profileselector .profile:hover {
			border: 1px dashed blue;
		}
		.profileselector .profile.active {
			background: grey;
			border: 1px dashed black;
		}
		.szem4_vije_optsTable {
			margin: initial;
			border-collapse: separate;
			border-spacing: 0px 7px;
		}
		.szem4_vije_optsTable input {
			font-size: 10pt;
		}
		#vije_opts input[type="checkbox"] { width: 17px; height: 17px; }

		.tooltip-wrapper { display: flex; flex-wrap: wrap; gap: 10px 0; }
		.tooltip-wrapper img { padding-left: 2px; padding-right: 0; display: table-cell; }
		.tooltip_hover { position: relative; display: table; border-collapse: collapse; }
		.tooltip_text {
			position: absolute; z-index: 1; left: 50%; bottom: 100%; transform: translateX(-50%); white-space: nowrap; font-style: normal; background: gray; padding: 5px 8px; border-radius: 3px; margin-bottom: 5px; color: white; display: none; border: 1px solid black;
		}
		.bottom-tooltip .tooltip_text { top: 100%; bottom: auto; }
		.tooltip_text:after { content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-top: 5px solid gray; border-left: 5px solid transparent; border-right: 5px solid transparent }
		.bottom-tooltip .tooltip_text:after { top: auto; bottom: 100%; border-bottom: 5px solid gray; border-top: 5px solid transparent; }
		table.no-bg-table td {
			vertical-align: middle;
			background: transparent;
		}
		table.no-bg-table td .flex_middle {
			display: flex;
			align-items: center;
		}
		.szem4_unitbox {
			display: inline-block;
			position: relative;
			border-radius: 5px;
		}
		.szem4_unitbox label {
			cursor: pointer;
			display: block;
		}
		.szem4_unitbox label:hover {
			background: rgba(0,0,0,0.2);
		}
		.szem4_unitbox input {
			cursor: pointer;
			margin-left: -2px;
			margin-right: 3px;
		}
		.szem4_farmolo_datatable_wrapper {
			display: flex;
			justify-content: space-between;
		}
		.szem4_farmolo_datatable_wrapper table {
			margin: 0;
		}
		.nopadding_td {
			padding: 0 !important;
		}
		.heartbeat_wrapper {
			height: 18px;
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
		}
		.heartbeat_icon {
			height: 15px;
			padding: 0 2px;
			margin-right: 5px;
			animation: heartbeatanimation 1.0s infinite;
			cursor: pointer
		}
		@keyframes heartbeatanimation {
			0% {
				height: 15px;
				padding: 0 2px;
			}
			33% {
				height: 15px;
				padding: 0 2px;
			}
			50% {
				height: 19px;
				padding: 0;
			}
			66% {
				height: 15px;
				padding: 0 2px;
			}
		}
		#farmolo_options table {
			color: black;
			text-align: left;
		}
		#farmolo_options table td,
		#vije_opts table.szem4_vije_optsTable td {
			vertical-align: middle;
		}
		#farmolo_options table td:first-child {
			padding: 0;
		}
		#farmolo_options .combo-cell {
			display: flex;
			align-items: center;
		}
		#farmolo_options .imgbox {
			width: 40px;
			margin-right: 5px;
			text-align: center;
		}
		#farmolo_options .imgbox img {
			height: 24px;
		}
		.left-background {
			width: calc(50vw - 512px);
			height: 100vh;
			position: fixed;
			left: 0;
			top: 0;
			background-repeat: no-repeat;
			background-position-x: right;
			background-size: cover;
		}
		.left-background video,
		.right-background video {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
		.left-background video {
			object-position: right center;
		}
		.left-background.mirrored_bg video {
			object-position: left center;
		}
		.left-background.mirrored_bg {
			background-position-x: left;
		}
		.left-background.mirrored_bg,
		.right-background.mirrored_bg {
			-moz-transform: scale(-1, 1);
			-webkit-transform: scale(-1, 1);
			-o-transform: scale(-1, 1);
			-ms-transform: scale(-1, 1);
			transform: scale(-1, 1);
		}
		.right-background video {
			object-position: left center;
		}
		.right-background.mirrored_bg video {
			object-position: right center;
		}
		.mirrored_bg video::-webkit-media-controls-panel {
			transform: scale(-1,1);
		}
		.right-background {
			width: calc(50vw - 512px);
			height: 100vh;
			position: fixed;
			right: 0;
			top: 0;
			background-repeat: no-repeat;
			background-position-x: left;
			background-size: cover;
		}
		.right-background.mirrored_bg {
			background-position-x: right;
		}
		#farm_hova .szem4_farms_overflow {
			display: none;
		}
		.style-settings-table { border-collapse: collapse; }
		.style-settings-table tr { border-bottom: 1px solid black; }
		table.style-settings-table td { padding: 15px 4px; vertical-align: middle; }
		.szem_old_build_tooltip {
			border-left: 3px solid red;
		}
		.szem_old_build_tooltip i {
			font-weight: bold;
			color: red;
		}
		.wagon_time {
			position: absolute;
			color: lavenderblush;
			font-size: 11px;
			top: 5px;
			width: 42px;
			text-align: center;
			text-shadow: 0px 0px 1px black;
		}
		#gyujto_form td:nth-child(4),
		#gyujto_form td:nth-child(5) {
			text-align: center;
		}
		.gyujto_table td:nth-child(2) {
			text-align: center;
		}
	`;
	let szemStyle_el = document.createElement('style');
	szemStyle_el.textContent = szemStyle;
	document.head.appendChild(szemStyle_el);
	document.getElementsByTagName("body")[0].innerHTML=`
		<div class="left-background">
			<video src="" autoplay loop muted></video>
		</div>
		<div class="right-background">
			<video src="" autoplay loop muted></video>
		</div>
		<div id="alert2">
			<div id="alert2head">
				<div>Üzenet</div>
				<div><a href='javascript: alert2("close");'>[ESC] ❌</a></div>
			</div>
			<p id="alert2szov"></p>
		</div>
		<div class="fej">
			<div id="global_notifications"></div>
			<table width="100%" align="center" style="background: #111; background-image:url('${pic("wallp.jpg")}'); background-size:1024px;">
				<tr>
					<td width="70%" id="fejresz" style="vertical-align:middle; margin:auto;">
						<h1><i></i></h1>
					</td>
					<td id="sugo" height="110px"></td>
				</tr>
				<tr><td colspan="2" id="menuk" style="">
					<div class="divrow" style="width: 1016px">
						<span class="divcell" id="kiegs" style="text-align:left; padding-top: 9px;width:870px;">
							<img src="${pic("muhely_logo.png")}" alt="GIT" title="GIT C&amp;C Műhely megnyitása" onclick="window.open('https://github.com/cncDAni2/klanhaboru')">
							<img src="${pic("kh_logo.png")}" alt="Game" title="Klánháború megnyitása" onclick="window.open(document.location.href)">
							|
						</span>
						<span class="divcell" style="text-align:right; width:250px">
							<a href=\'javascript: nyit("naplo");\' onmouseover="sugo(this,\'Események naplója\')">Napló</a>
							<a href=\'javascript: nyit("debug");\' onmouseover="sugo(this,\'Hibanapló\')">Debug</a>
							<a href=\'javascript: nyit("hang");\'><img src="${pic("hang.png")}" onmouseover="sugo(this,\'Hangbeállítások\')" alt="hangok"></a>
						</span>
					</div>
				</td></tr>
			</table>
		</div>
		<div id="content"></div>`;
	document.getElementById("content").innerHTML=`
	<table class="menuitem" width="1024px" align="center" id="naplo" style="display: none"><tbody>
	<tr><td>
		<h1 align="center">Napló</h1>
		<br>
		<br>
		<table align="center" class="vis" id="naploka"><tbody>
			<tr>
				<th onclick="\'rendez("datum2",false,this,"naploka",0)\'" style="cursor: pointer;">Dátum</th>
				<th onclick="\'rendez("szoveg",false,this,"naploka",1)\'" style="cursor: pointer;">Script</th>
				<th onclick="\'rendez("szoveg",false,this,"naploka",2)\'" style="cursor: pointer;">Esemény</th>
			</tr>
		</tbody></table>
	</td></tr>
</tbody></table>
<table class="menuitem" width="1024px" align="center" id="debug" style="display: none"><tbody>
	<tr><td>
		<h1 align="center">DeBugger</h1>
		<br>
		<br>
		<button type="button" onclick="debug_urit()">Ürít</button>
		<button type="button" onclick="switchMobileMode()">Mobile_mode</button><br>
		<br>
		<table align="center" class="vis" id="debugger">
		<colgroup>
			<col style="width: 165px;">
			<col style="width: 165px;">
			<col style="width: calc(100% - 330px);">
		</colgroup>
		<tbody>
			<tr>
				<th onclick="rendez('datum2',false,this,'debugger',0)" style="cursor: pointer;">Dátum</th>
				<th onclick="rendez('szoveg',false,this,'debugger',1)" style="cursor: pointer;">Script</th>
				<th onclick="rendez('szoveg',false,this,'debugger',2)" style="cursor: pointer;">Esemény</th>
			</tr>
		</tbody></table>
	</td></tr>
</tbody></table>
<table class="menuitem" width="1024px" align="center" id="hang" style="display: none"><tbody>
	<tr><td><form id="settings">
		<p align="center">
			<audio id="audio1" controls="controls" autoplay="autoplay">
				<source id="wavhang" src="" type="audio/wav">
			</audio>
		</p>
		<h1 align="center">Hangbeállítás</h1>
		<br>
		<div id="hangok" style="display:table;">
			<div style="display:table-row;">
				<div style="display:table-cell; padding:10px;" onmouseover="sugo(this, 'Ha be van kapcsolva, bot védelem esetén ez a link is megnyitódik, mint figyelmeztetés.')">
					<b><input type="checkbox" name="altbot" onchange="saveSettings()"> Alternatív botriadó?
						<br>Megnyitott URL (egyszer)<br>
						<input type="text" id="altbotURL" name="altboturl" size="42" onchange="saveSettings()" value="http://www.youtube.com/watch?v=k2a30--j37Q">
					</b>
				</div>
				<b>
				</b>
			</div>
			<b>
			</b>
		</div>
		<h2 align="center">🚨 Bot védelem értesítések</h2>
		<div id="bot_notifications" style="display:table; width:100%">
			<table class="vis" style="color:black; margin:auto;">
				<tr>
					<th colspan="2" style="background:#e74c3c; color:white;">Discord Értesítés</th>
				</tr>
				<tr>
					<td><input type="checkbox" id="discord_enabled" onchange="updateBotNotifications()"> Engedélyezve</td>
					<td onmouseover="sugo(this, 'Discord webhook URL-t adj meg. Így kapsz értesítést ha bot védelmet észlel.')">
						Webhook URL:<br>
						<input type="text" id="discord_webhook" size="60" placeholder="https://discord.com/api/webhooks/..." onchange="updateBotNotifications()">
					</td>
				</tr>
				<tr>
					<th colspan="2" style="background:#0088cc; color:white;">Telegram Értesítés</th>
				</tr>
				<tr>
					<td><input type="checkbox" id="telegram_enabled" onchange="updateBotNotifications()"> Engedélyezve</td>
					<td onmouseover="sugo(this, 'Telegram bot beállítások. Bot tokent és chat ID-t adj meg.')">
						Bot Token:<br>
						<input type="text" id="telegram_token" size="60" placeholder="123456:ABC-DEF1234..." onchange="updateBotNotifications()"><br>
						Chat ID:<br>
						<input type="text" id="telegram_chatid" size="20" placeholder="123456789" onchange="updateBotNotifications()"><br>
						Üzenetek száma: <input type="number" id="telegram_repeat" value="30" min="1" max="100" size="5" onchange="updateBotNotifications()">
						Időköz (ms): <input type="number" id="telegram_interval" value="1000" min="500" max="5000" size="5" onchange="updateBotNotifications()">
					</td>
				</tr>
				<tr>
					<td colspan="2" style="text-align:center;">
						<button onclick="testBotNotifications()" type="button">🧪 Teszt értesítés küldése</button>
					</td>
				</tr>
			</table>
		</div>
		<h1 align="center">Háttér- és stílus beállítás</h1>
		<div>
			<div class="profileselector">
				<div class="profile" onclick="selectTheme(1)">Téma 1</div>
				<div class="profile" onclick="selectTheme(2)">Téma 2</div>
				<div class="profile" onclick="selectTheme(3)">Téma 3</div>
				<div class="profile" onclick="selectTheme(4)">Téma 4</div>
			</div>
			<table class="style-settings-table">
			<tr><td>Bal háttérkép</td><td><input type="text" size="80" name="wallp_left" value="https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/TW3.webp" onchange="onWallpChange()"><br>
										Videó: <input type="text" size="70" name="wallp_left_vid" value="-" onchange="onWallpChange()"><br>
										Tükrözött? <input type="checkbox" onclick="onWallpChange()" name="wallp_left_mirror" checked></td><td rowspan="2">Videólink. Ha nem szeretnél írj "-" -t, és háttérképet használ. Ha az sincs vagy érvénytelen, akkor háttérszín lesz használva</td></tr>
			<tr><td>Jobb háttérkép</td><td><input type="text" size="80"  name="wallp_right" value="https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/TW4.webp" onchange="onWallpChange()"><br>
										Videó: <input type="text" size="70" name="wallp_right_vid" value="-" onchange="onWallpChange()"><br>
										Tükrözött? <input type="checkbox" onclick="onWallpChange()" name="wallp_right_mirror"></td></tr>
			<tr><td>Tartalom háttérszíne</td><td><input type="text" size="80" name="content_bgcolor" value="#d2c09e url('https://dshu.innogamescdn.com/asset/ae6c0149/graphic/background/bg-image.webp')" onchange="onWallpChange()"></td><td>[Default: #d2c09e with TW texture] Minden CSS "background" property támogatott. <a href="https://www.w3schools.com/cssref/css3_pr_background.php" target="_BLANK">W3School link</a></td></tr>
			<tr><td>Tartalom betűszíne</td><td><input type="text" size="30" name="content_fontcolor" value="#000" onchange="onWallpChange()"></td><td>[Default: #000] Minden CSS "color" property támogatott. <a href="https://www.w3schools.com/cssref/css_colors_legal.php" target="_BLANK">W3School link</a></td></tr>
			<tr><td>Keret színe</td><td><input type="text" size="30" name="content_border" value="#8B4513" onchange="onWallpChange()"></td><td>[Default: #8B4513] Valid CSS "border-color" property támogatott. <a href="https://www.w3schools.com/css/css_border_color.asp" target="_BLANK">W3School link</a></td></tr>
			<tr><td>Vetett árnyék</td><td><input type="text" size="30" name="content_shadow" value="0 0 12px black" onchange="onWallpChange()"></td><td>[Default: 0 0 12px black] Valid CSS "box-shadow" property támogatott. <a href="https://www.w3schools.com/cssref/css3_pr_box-shadow.php" target="_BLANK">W3School link</a></td></tr>
			<tr><td>Keret szélessége / Frame width</td><td><input type="number" size="10" name="frame_width" value="1024" min="800" max="1920" onchange="onWallpChange(true, 'frame_width')"> px</td><td>[Default: 1024] A fő tartalom szélessége pixelben. Min: 800, Max: 1920</td></tr>
			<tr><td>Beállítás táblázat háttere</td>       <td><input type="text" size="30" name="table_bgcolor"      value="-" onchange="onWallpChange(true, 'table_bgcolor')"></td>     <td>[Default: -] A háttér cellánként értendő. Minden CSS "background" property támogatott. <a href="https://www.w3schools.com/cssref/css3_pr_background.php" target="_BLANK">W3School link</a></td></tr>
			<tr><td>Beállítás táblázat szövegszíne</td>   <td><input type="text" size="30" name="table_color"        value="-" onchange="onWallpChange(true, 'table_color')"></td>       <td>[Default: -] Minden CSS "color" property támogatott. <a href="https://www.w3schools.com/cssref/css_colors_legal.php" target="_BLANK">W3School link</a></td></tr>
			<tr><td>Táblázatok fejlécének háttere</td>    <td><input type="text" size="30" name="table_head_bgcolor" value="-" onchange="onWallpChange(true, 'table_head_bgcolor')"></td><td>[Default: -] A háttér cellánként értendő. Minden CSS "background" property támogatott. <a href="https://www.w3schools.com/cssref/css3_pr_background.php" target="_BLANK">W3School link</a></td></tr>
			<tr><td>Táblázatok fejlécének szövegszíne</td><td><input type="text" size="30" name="table_head_color"   value="-" onchange="onWallpChange(true, 'table_head_color')"></td>  <td>[Default: -] A háttér cellánként értendő. Minden CSS "background" property támogatott. <a href="https://www.w3schools.com/cssref/css3_pr_background.php" target="_BLANK">W3School link</a></td></tr>
		</div></table>
	</form></td></tr>
</tbody></table>`;
	document.title="SZEM IV";
	
	debug("SZEM 4","Verzió: GIT_"+new Date().toLocaleDateString());
	debug("SZEM 4","Prog.azon: "+AZON);
	debug("SZEM 4","W-Speed: "+SPEED);
	debug("SZEM 4","U-Speed: "+UNIT_S);
	return true;
}catch(e){alert("Hiba indításkor:\n\nError at starting:\n"+e); return false;}}

function pic(file){
	return "https://raw.githubusercontent.com/cncDAni2/klanhaboru/main/images/szem4/"+file;
}
function picBuilding(bId) {
	return `<img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/${bId}3.png">`;
}

function selectTheme(themeId) {
	if (themeId == undefined || isNaN(themeId) || themeId < 0 || themeId > 4) themeId = 1;
	SZEM4_SETTINGS.selectedProfile = themeId;
	const themeboxes = document.querySelectorAll('.profileselector .profile');
	themeboxes.forEach((el, i) => {
		if (themeId == i+1) el.classList.add('active'); else el.classList.remove('active');
	});
	SZEM4_SETTINGS = Object.assign(SZEM4_SETTINGS, SZEM4_SETTINGS[`profile${themeId}`]);

	//Load Theme
	const loadObj = SZEM4_SETTINGS[`profile${themeId}`];
	const themeOptions = document.querySelectorAll('#settings .style-settings-table input');
	themeOptions.forEach((inputEl) => {
		if (inputEl.name && loadObj[inputEl.name] !== undefined) {
			if (inputEl.type === 'checkbox') {
				inputEl.checked = loadObj[inputEl.name];
			} else if (inputEl.value) {
				inputEl.value = loadObj[inputEl.name];
			}
		}
	});
	onWallpChange(true, 'ALL');
}

function onWallpChange(isUpdate=true, changedText) {
	const settingsForm = document.getElementById('settings');
	for (let i=0;i<settingsForm.length;i++) {
		const el = settingsForm[i];
		if (el.type == 'text' && el.value === '') el.value = '-';
	}

	if (settingsForm.wallp_left_vid.value === '-')
		document.querySelector('.left-background video').style.display = 'none';
	else {
		document.querySelector('.left-background video').style.display = 'inline';
		loadVideoWithRetry(document.querySelector('.left-background video'), settingsForm.wallp_left_vid.value);
	}

	if (settingsForm.wallp_right_vid.value === '-')
		document.querySelector('.right-background video').style.display = 'none';
	else {
		document.querySelector('.right-background video').style.display = 'inline';
		loadVideoWithRetry(document.querySelector('.right-background video'), settingsForm.wallp_right_vid.value);
	}

	// document.querySelector('.left-background video').src = settingsForm.wallp_left_vid.value;
	// document.querySelector('.right-background video').src = settingsForm.wallp_right_vid.value;
	document.getElementsByClassName('left-background')[0].style.backgroundImage = `url('${settingsForm.wallp_left.value}')`;
	document.getElementsByClassName('right-background')[0].style.backgroundImage = `url('${settingsForm.wallp_right.value}')`;
	if (settingsForm.wallp_left_mirror.checked)
		document.querySelector('.left-background').classList.add('mirrored_bg');
	else
		document.querySelector('.left-background').classList.remove('mirrored_bg');
	if (settingsForm.wallp_right_mirror.checked)
		document.querySelector('.right-background').classList.add('mirrored_bg');
	else
		document.querySelector('.right-background').classList.remove('mirrored_bg');

	$('body').css('background',settingsForm.content_bgcolor.value);
	// $('.menuitem').css('background',settingsForm.content_bgcolor.value);
	$('#content').css('background',settingsForm.content_bgcolor.value);
	$('table.menuitem').css('color',settingsForm.content_fontcolor.value);
	$('#content a').css('color',settingsForm.content_fontcolor.value);
	$('table.style-settings-table').css('color',settingsForm.content_fontcolor.value);
	$('table.menuitem').css('border-color', settingsForm.content_border.value);
	$('.fej > table').css('border-color', settingsForm.content_border.value);
	$('#content > table').css('box-shadow', settingsForm.content_shadow.value);
	$('.fej').css('box-shadow', settingsForm.content_shadow.value);
	if (changedText === 'frame_width' || changedText === 'ALL') {
		const frameWidth = parseInt(settingsForm.frame_width.value, 10) || 1024;
		const halfWidth = frameWidth / 2;
		$('#content').css('width', frameWidth + 'px');
		$('.fej').css('width', frameWidth + 'px');
		$('.fej > table').css('background-size', frameWidth + 'px');
		$('.menuitem').attr('width', frameWidth + 'px');
		$('.left-background').css('width', `calc(50vw - ${halfWidth}px)`);
		$('.right-background').css('width', `calc(50vw - ${halfWidth}px)`);
		// Update the divrow width in menu
		$('#menuk .divrow').css('width', (frameWidth - 8) + 'px');
	}
	if (changedText === 'table_bgcolor' || changedText === 'ALL') {
		const styleElement = $("<style>")
			.attr("type", "text/css")
			.html(`.vis:not(#farm_honnan):not(#farm_hova) td { background: ${settingsForm.table_bgcolor.value}; }`);
		$("head").append(styleElement);
	}
	if (changedText === 'table_head_bgcolor' || changedText === 'ALL') {
		const styleElement = $("<style>")
			.attr("type", "text/css")
			.html(`.vis th { background: ${settingsForm.table_head_bgcolor.value} !important; }`);
		$("head").append(styleElement);
	}
	if (changedText === 'table_color' || changedText === 'ALL') {
		const styleElement = $("<style>")
			.attr("type", "text/css")
			.html(`.vis:not(#farm_honnan):not(#farm_hova) td { color: ${settingsForm.table_color.value}; }`);
		$("head").append(styleElement);
	}
	if (changedText === 'table_head_color' || changedText === 'ALL') {
		const styleElement = $("<style>")
			.attr("type", "text/css")
			.html(`.vis th { color: ${settingsForm.table_head_color.value} !important; }`);
		$("head").append(styleElement);
	}
	if (isUpdate) saveSettings();

	function loadVideoWithRetry(videoElement, videoSrc, maxAttempts=5, delayBetweenAttempts=1000) {
		let attempts = 0;
	
		function tryLoadVideo() {
			if (attempts >= maxAttempts) {
				console.error('Max attempts reached. Video not available.');
				return;
			}
		
			videoElement.src = videoSrc;
			attempts++;
		
			// Add an event listener to check for errors
			videoElement.addEventListener('error', function errorHandler() {
				console.error(`Error loading video from ${videoElement.src}`);
				// Retry loading the video after a delay
				setTimeout(tryLoadVideo, delayBetweenAttempts);
				// Remove the event listener to prevent multiple error events
				videoElement.removeEventListener('error', errorHandler);
			});
		
			videoElement.load();
		}
	
		tryLoadVideo();
	}
}

function soundVolume(vol){
	document.getElementById("audio1").volume=vol;
}

function playSound(hang, ext='wav'){try{
	let hang2 = hang;
	if (hang.includes('farmolas')) hang2 ='farmolas';
	var isOn=document.getElementsByName(hang2)[0];
	if (isOn==undefined) {debug("hanghiba","Nem definiált hang: "+hang2); return}
	if (isOn.checked==false) return;
	var play = `https://raw.githubusercontent.com/cncDAni2/klanhaboru/main/images/szem4/${hang}.${ext}`;
	document.getElementById("wavhang").src=play;
	document.getElementById("audio1").load();
	document.getElementById("audio1").play();
	//setTimeout(function() { if (document.getElementById("audio1").paused) document.getElementById("audio1").play()}, 500);
}catch(e){alert2(e);}}

function validate(evt) {
	var theEvent = evt || window.event;
	var key = theEvent.keyCode || theEvent.which;
	key = String.fromCharCode( key );
	var regex = /[0-9]|\./;
	if( !regex.test(key) ) {
		theEvent.returnValue = false;
		if(theEvent.preventDefault) theEvent.preventDefault();
	}
}

function shorttest() {
	try {
		var hiba = ''; var warn = '';
		let optsForm = document.getElementById('farmolo_options');

		if (optsForm.termeles.value == '') hiba += 'Termelés/óra értéke üres. Legalább egy 0 szerepeljen!\n';
		if (parseInt(optsForm.termeles.value, 10) < 50) warn += "Termelés/óra értéke nagyon alacsony. Min 50\n";

		if (optsForm.maxtav_ora.value == '') hiba += 'Max táv/óra: Üres érték. \n';
		if (optsForm.maxtav_p.value == '') hiba += 'Max táv/perc: Üres érték. \n';
		if (parseInt(optsForm.maxtav_ora.value, 10) == 0 && parseInt(optsForm.maxtav_p.value, 10) < 1) hiba += 'A jelenleg megadott max távolság 0!\n';
		if (parseInt(optsForm.maxtav_ora.value, 10) == 0 && parseInt(optsForm.maxtav_p.value, 10) < 40) warn += 'A jelenleg megadott max távolság nagyon rövid!\n';

		if (optsForm.kemdb.value == '') hiba += 'Ha nem szeretnél kémet küldeni, írj be 0-t.\n';
		if (parseInt(optsForm.kemdb.value, 10) > 3) warn += '3-nál több kém egyik szerveren sem szükséges. Javasolt: 1 vagy 3.\n';
		if (optsForm.isforced.checked && parseInt(optsForm.kemdb.value, 10) == 0) warn += 'Kényszeríted a kémek küldését, de a küldendő kém értékére 0 van megadva!\n';

		if (optsForm.kemperc.value == '') hiba += 'Kém/perc üres. Ha mindig küldenél kémet, legyen 0, bár ilyenre semmi szükség';

		if (optsForm.minsereg.value == '') hiba += 'Ha minimum limit nélkül szeretnéd egységeid küldeni, írj be 0-t.\n';

		if (optsForm.sebesseg_p.value == '') hiba += 'A legkevesebb pihenő idő: 1 perc, ne hagyd üresen.\n';
		if (parseInt(optsForm.sebesseg_p.value, 10) < 1) hiba += 'A legkevesebb pihenő idő: 1 perc.\n';
		if (parseInt(optsForm.sebesseg_p.value, 10) > 30) warn += '30 percnél több pihenő időt adtál meg. Biztos?\n';
		if (parseInt(optsForm.sebesseg_p.value, 10) > 150) hiba += '150 percnél több pihenő időt nem lehet megadni.\n';
		if (optsForm.sebesseg_m.value == '') hiba += 'A leggyorsabb ciklusidő: 200 ms, ne hagyd üresen.\n';
		if (parseInt(optsForm.sebesseg_m.value, 10) < 200) hiba += 'A leggyorsabb ciklusidő: 200 ms\n';
		if (parseInt(optsForm.sebesseg_m.value, 10) > 5000) hiba += '5000 ms-nél több ciklusidő felesleges, és feltűnő. Írj be 5000 alatti értéket.\n';

		if (optsForm.raktar.value == '' || parseInt(optsForm.raktar.value, 10) < 20) hiba += 'Raktár telítettségi értéke túl alacsony, így vélhetőleg sehonnan se fog fosztani. Min 20%';

		if (optsForm.megbizhatosag.value == '' || parseInt(optsForm.megbizhatosag.value, 10) < 5 || parseInt(optsForm.megbizhatosag.value, 10) > 180) hiba += 'Megbízhatósági szint 5-180 perc között legyen';
		// inkább hogy az első szám legyen kisebb mint a megb.
		else MAX_IDO_PERC = parseInt(optsForm.megbizhatosag.value, 10);

		if (hiba != '' && !FARM_PAUSE) document.querySelector('#kiegs img[name="farm"]').click();
		if (hiba != '') {
			alert2('<b>Egy vagy több beállítási hiba miatt nem indítható a farmoló!</b><br><br>' + hiba);
			return false;
		} else {
			if (warn == '')
				alert2('close');
			else
				alert2('Javaslatok:\n' + warn);
		}
		for (const el of optsForm) {
			if (!el.name) continue;
			if (el.type == 'checkbox') {
				SZEM4_FARM.OPTIONS[el.name] = el.checked;
			} else {
				if (isNaN(el.value)) {
					SZEM4_FARM.OPTIONS[el.name] = el.value;
				} else {
					SZEM4_FARM.OPTIONS[el.name] = parseInt(el.value, 10);
				}
			}
		}
		return true;
	} catch (e) { alert2('Hiba validáláskor:\n' + e); }
}

var SUGOORA;
function sugo(el, str) {
	if (str == '') {
		document.getElementById("sugo").innerHTML=str;
		return;
	}
	if (!el.hasAttribute("data-hossz")) {
		el.addEventListener("mouseout", (event) => {
			SUGOORA = setTimeout(() => sugo(event.fromElement, ""), parseInt(event.fromElement.getAttribute('data-hossz'), 10));
		});
	}
	var hossz=str.length;
	hossz=Math.round((hossz*1000)/40);
	if (SUGOORA!="undefined") clearTimeout(SUGOORA);
	document.getElementById("sugo").innerHTML=str;
	el.setAttribute('data-hossz', hossz);
}

function prettyDatePrint(m) {
	return m.getFullYear() + "/" +
	("0" + (m.getMonth()+1)).slice(-2) + "/" +
	("0" + m.getDate()).slice(-2) + " " +
	("0" + m.getHours()).slice(-2) + ":" +
	("0" + m.getMinutes()).slice(-2) + ":" +
	("0" + m.getSeconds()).slice(-2);
}
function nyit(ezt){try{
	var temp=document.getElementById("content").childNodes;
	var cid="";
	for (var i=0;i<temp.length;i++) {
		if (temp[i].nodeName.toUpperCase()=="TABLE") {cid=temp[i].getAttribute("id");
		$("#"+cid).fadeOut(300);}
	} var patt=new RegExp("\""+ezt+"\"");
	temp=document.getElementById("menuk").getElementsByTagName("a");
	for (i=0;i<temp.length;i++) {
		temp[i].style.padding="3px";
		if (patt.test(temp[i].getAttribute("href"))) temp[i].style.backgroundColor="#000000"; else temp[i].style.backgroundColor="transparent";
	}
	setTimeout(function(){$("#"+ezt).fadeIn(300)},300);
	//addFlyingOptions(ezt);
}catch(e){alert(e);}}

function alert2(szov){
	szov=szov+"";
	if (szov=="close") {$("#alert2").hide(); return;}
	szov=szov.replace("\n","<br>");
	document.getElementById("alert2szov").innerHTML=szov;
	$("#alert2").show();
}

function naplo(script,szoveg){
	var d=new Date();
	var perc=d.getMinutes(); var mp=d.getSeconds(); if (perc<10) perc="0"+perc; if (mp<10) mp="0"+mp;
	var honap=new Array("Jan","Febr","March","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec");
	var table=document.getElementById("naploka");
	var row=table.insertRow(1);
	var cell1=row.insertCell(0);
	var cell2=row.insertCell(1);
	var cell3=row.insertCell(2);
	cell1.innerHTML=honap[d.getMonth()]+" "+d.getDate()+", "+d.getHours()+":"+perc+":"+mp;
	cell2.innerHTML=script;
	cell3.innerHTML=szoveg;
	playSound("naplobejegyzes");
	return;
}
function debug(script,szoveg) {
	let d = new Date();
	var table=document.getElementById("debugger");
	var row=table.insertRow(1);
	var cell1=row.insertCell(0);
	var cell2=row.insertCell(1);
	var cell3=row.insertCell(2);
	cell1.innerHTML=d.toLocaleString();
	cell2.innerHTML=script;
	cell3.innerHTML=szoveg;
	if (table.rows.length > 300) {
		$("#debugger").find('tr:gt(150)').remove();
	}
	if (table.rows.length > 10 && d - new Date(`${table.rows[10].cells[0].textContent}`) < 180000) {
		let errorCount = 0;
		for (var i = 1; i < 11; i++) {
			let cellText = table.rows[i].cells[2].textContent;
			if (cellText.toLowerCase().includes("error")) {
				errorCount++;
			}
		}
		if (errorCount > 4) {
			naplo('Auto-error', 'Túl sok hiba valahol?');
			playSound('kritikus_hiba');
		}
	}
}
function debug_urit() {
	$("#debugger").find('tr:gt(0)').remove();
}

function ujkieg(id,nev,tartalom){
	if (document.getElementById(nev)) return false;
	ALL_EXTENSION.push(id);
	// Motors that start paused should show pause icon initially
	const pausedMotors = ['farm', 'vije', 'gyujto', 'norbi0n_farm', 'recruitment', 'barb'];
	const initialIcon = pausedMotors.includes(id) ? 'pause' : 'play';
	document.getElementById("kiegs").innerHTML+='<img onclick=\'szunet("'+id+'",this)\' name="'+id+'" onmouseover=\'sugo(this,"Az érintett scriptet tudod megállítani/elindítani.")\' src="'+pic(initialIcon + ".png")+'" alt="Stop" title="Klikk a szüneteltetéshez"> <a href=\'javascript: nyit("'+id+'");\'>'+nev.toUpperCase()+'</a> ';
	document.getElementById("content").innerHTML+='<table class="menuitem" width="1024px" align="center" id="'+id+'" style="display: none">'+tartalom+'</table>';
	return true;
}
function ujkieg_hang(nev,hangok){
	try{var files=hangok.split(";");}catch(e){var files=hangok;}
	var hely=document.getElementById("hangok").getElementsByTagName("div")[0];
	var kieg=document.createElement("div"); kieg.setAttribute("style","display:table-cell; padding:10px;");
	var str="<h3>"+nev+"</h3>";
	for (var i=0;i<files.length;i++) {
		str+=`<input type="checkbox" name="${files[i]}" checked onchange="saveSettings()"> <a href="javascript: playSound('${files[i]}');"> ${files[i]} </a><br>`;
	}
	kieg.innerHTML=str;
	hely.appendChild(kieg);
	return;
}

function szunet(script,kep){try{
	switch (script) {
		case "farm":
			FARM_PAUSE=!FARM_PAUSE;
			var sw=FARM_PAUSE;
			break;
		case "vije":
			VIJE_PAUSE=!VIJE_PAUSE;
			var sw=VIJE_PAUSE;
			break;
		case "idtamad":
			alert2("Ezt a script nem állítható meg, mivel nem igényel semmilyen erőforrást.<br>Ha a hangot szeretnéd kikapcsolni, megteheted azt a hangbeállításoknál.");
			break;
		case "epit":
			EPIT_PAUSE=!EPIT_PAUSE;
			var sw=EPIT_PAUSE;
			break;
		case "adatok":
			ADAT_PAUSE=!ADAT_PAUSE;
			var sw=ADAT_PAUSE;
			break;
		case 'gyujto':
			GYUJTO_PAUSE = !GYUJTO_PAUSE;
			var sw = GYUJTO_PAUSE;
			break;
		case 'norbi0n_farm':
			NORBI0N_FARM_PAUSE = !NORBI0N_FARM_PAUSE;
			var sw = NORBI0N_FARM_PAUSE;
			break;
		case 'recruitment':
			RECRUITMENT_PAUSE = !RECRUITMENT_PAUSE;
			var sw = RECRUITMENT_PAUSE;
			break;
		case 'barb':
			BARB_PAUSE = !BARB_PAUSE;
			var sw = BARB_PAUSE;
			break;
		default: {alert2("Sikertelen script megállatás. Nincs ilyen alscript: "+script);return;}
	}
	
	if (sw) {
		kep.src=pic("pause.png");
		kep.alt="Start";
		kep.title="Klikk a folytatáshoz";
	} else {
		kep.src=pic("play.png");
		kep.alt="Stop";
		kep.title="Klikk a szüneteltetéshez";
	}
	
	if (script=="farm") shorttest();
}catch(e){alert2("Hiba:\n"+e);}}

function distCalc(S,D){
	S[0]=parseInt(S[0]);
	S[1]=parseInt(S[1]);
	D[0]=parseInt(D[0]);
	D[1]=parseInt(D[1]);
	return Math.abs(Math.sqrt(Math.pow(S[0]-D[0],2)+Math.pow(S[1]-D[1],2)));
}

function rendez(tipus, isAsc, thislink, table_azon, oszlopNo){try{
    /*Tipus: "szoveg" v "szam" */
	var OBJ=document.getElementById(table_azon);
	var prodtable=document.getElementById(table_azon).rows;
	if (prodtable.length<2) return;
	var tavok=new Array(); var sorok=new Array(); var indexek=new Array();
	for (var i=1;i<prodtable.length;i++) {
		let cellText = prodtable[i].cells[oszlopNo].textContent.trim();
		switch (tipus) {
			case "szoveg": tavok[i-1]=cellText; break;
			case "szam":
				let tc = cellText;
				if (!tc || tc == '')
					tavok[i-1] = -0.1;
				else
					tavok[i-1]=parseInt(tc.replace(".",""));
				break;
			case "datum": if (cellText == '' || cellText == '---') tavok[i-1]=getServerTime(); else tavok[i-1]=new Date(cellText); break;
			case "datum2": var honap=new Array("Jan","Febr","March","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec");
				var d=new Date();
				var s=cellText;
				d.setMonth(honap.indexOf(s.split(" ")[0]));
				d.setDate(s.split(" ")[1].replace(",",""));
				d.setHours(s.split(" ")[2].split(":")[0]);
				d.setMinutes(s.split(" ")[2].split(":")[1]);
				d.setSeconds(s.split(" ")[2].split(":")[2]);
				tavok[i-1]=d; break;
			case "lista":    tavok[i-1] = prodtable[i].cells[oszlopNo].getElementsByTagName("select")[0].value; break;
			case "checkbox": tavok[i-1] = prodtable[i].cells[oszlopNo].querySelector('input[type="checkbox"]').checked?1:0; break;
			case "tanya": tavok[i-1]=parseInt(cellText.split('/')[0]); break;
			default: throw("Nem értelmezhető mi szerint kéne rendezni.");
		}
		sorok[i-1]=prodtable[i];
		indexek[i-1]=i-1;
	}
	
	for (var i=0;i<tavok.length;i++) {
		var min=i;
		for (var j=i;j<tavok.length;j++) {
			if (isAsc) {if (tavok[j]>tavok[min]) min=j;}
			else {if (tavok[j]<tavok[min]) min=j;}
		}
		var Ttemp=tavok[i];
		tavok[i]=tavok[min];
		tavok[min]=Ttemp;
		
		var Ttemp=indexek[i];
		indexek[i]=indexek[min];
		indexek[min]=Ttemp;
	}
	
	for (var i=prodtable.length-1;i>0;i--) {
		OBJ.deleteRow(i);
	}
	
	for (var i=0;i<tavok.length;i++) {
		OBJ.appendChild(sorok[indexek[i]]);
	}
	
	thislink.setAttribute("onclick","rendez(\""+tipus+"\","+!isAsc+",this,\""+table_azon+"\","+oszlopNo+")");
	hideFarms();
	return;
}catch(e){alert2("Hiba rendezéskor:\n"+e);}}

function rovidit(tipus) {
	var ret="";
	switch (tipus) {
		case "egysegek": 
			for (var i=0;i<UNITS.length;i++)
			ret+=`<div class="szem4_unitbox" data-allunit="999" name="${UNITS[i]}"><label>
				<img src="/graphic/unit/unit_${UNITS[i]}.png">
				<input type="checkbox" name="${UNITS[i]}" onclick="szem4_farmolo_multiclick(${i},'honnan',this.checked)">
				</label></div>`;
			break;
		default: ret="";
	}
	return ret;
}

function getServerTime(ref, isSilent=false) {
	if (ref) {
		if (ref.document.getElementById('serverTime') && ref.document.getElementById('serverDate')) {
			let currentDate = convertDateString(ref.document.getElementById('serverTime').textContent, ref.document.getElementById('serverDate').textContent);
			let newDate = new Date();
			let diff = currentDate - newDate;
			if (Math.abs(diff / 60000) > 2) {
				let newZone = Math.round(diff / 900000) * 15;
				if (TIME_ZONE != newZone && !isSilent) naplo('Időzóna 🕐', `Időeltolódás frissítve: eltolódás ${TIME_ZONE} perccel.`);
				TIME_ZONE = newZone;
			}
		} else {
			if (!isSilent) naplo('Időzóna 🕐', `Nem megállapítható időzóna (betöltetlen lap?), frissítés sikertelen.`);
		}
	}
	let newDate = new Date();
	newDate.setMinutes(newDate.getMinutes() + TIME_ZONE);
	return newDate;

	function convertDateString(timeString, dateString) {
		let dateParts = dateString.split("/");
		let newDate = dateParts[1] + "/" + dateParts[0] + "/" + dateParts[2];
		return new Date(newDate + " " + timeString);
	}
}

function maplink(koord){
	return '<a href="'+VILL1ST.replace("screen=overview","x="+koord.split("|")[0]+"&y="+koord.split("|")[1]+"&screen=map")+'" target="_BLANK">'+koord+'</a>';
}
/*dupla klikk események*/
function multipricer(ez,tip,s1){try{
	if (ez==undefined) return;
	if (!(document.getElementById("farm_multi_"+ez).checked)) return;
	var x=document.getElementById("farm_"+ez).rows;
	for (var i=x.length-1;i>0;i--) {
		if (x[i].style.display!="none") {
			let koord = x[i].closest('tr').cells[0].textContent;
			SZEM4_FARM.DOMINFO_FARMS[koord].szin = SZEM4_FARM.DOMINFO_FARMS[koord].szin || {};
			switch(tip) {
				case "del": delete SZEM4_FARM.DOMINFO_FARMS[koord]; x[i].parentNode.removeChild(x[i]); break;
				case "urit": x[i].cells[2].innerHTML=""; break;
				case "mod": SZEM4_FARM.DOMINFO_FARMS[koord].nyers = parseInt(s1, 10); x[i].cells[3].innerHTML=s1; break;
				case "htor":
					SZEM4_FARM.DOMINFO_FARMS[koord].szin.falu = '';
					x[i].cells[0].style.backgroundColor="#f4e4bc";
					break;
				case 'hreset':
					SZEM4_FARM.DOMINFO_FARMS[koord].szin.fal = '';
					SZEM4_FARM.DOMINFO_FARMS[koord].szin.marks = '';
					x[i].cells[2].style.backgroundColor = s1;
					x[i].cells[2].style.border = '';
					break;
				case "hcser": 
					SZEM4_FARM.DOMINFO_FARMS[koord].szin.fal = s1;
					x[i].cells[2].style.backgroundColor=s1;
					break;
				case 'addmark':
					SZEM4_FARM.DOMINFO_FARMS[koord].szin.marks = s1;
					x[i].cells[2].style.border = `2px solid ${s1}`;
					break;
			}
		}
	}
}catch(e){ console.error(e); }}

function sortorol(cella,ismulti) {
	var row = cella.parentNode;
	delete SZEM4_FARM.DOMINFO_FARMS[row.cells[0].textContent];
	delete SZEM4_FARM.DOMINFO_FROM[row.cells[0].textContent];
	row.parentNode.removeChild(row);
	multipricer(ismulti, "del");
}
function urit(cella,ismulti){
	cella.innerHTML="";
	multipricer(ismulti,"urit");
}
function modosit_szam(cella){
	var uj=prompt('Új érték?');
	if (uj==null) return;
	uj=uj.replace(/[^0-9]/g,"");
	if (uj=="") return;
	uj = parseInt(uj, 10);
	cella.innerHTML=uj;
	SZEM4_FARM.DOMINFO_FARMS[cella.closest('tr').cells[0].textContent].nyers = uj;
	multipricer("hova","mod",uj);
}
function hattertolor(cella) {
	cella.style.backgroundColor="#f4e4bc";
	let koord = cella.closest('tr').cells[0].textContent;
	SZEM4_FARM.DOMINFO_FARMS[koord].szin = SZEM4_FARM.DOMINFO_FARMS[koord].szin || {};
	SZEM4_FARM.DOMINFO_FARMS[koord].szin.falu = '';
	multipricer("hova","htor");
}
function hattercsere(cella){
	var szin = "#00FF00";
	let koord = cella.closest('tr').cells[0].textContent;
	SZEM4_FARM.DOMINFO_FARMS[koord].szin = SZEM4_FARM.DOMINFO_FARMS[koord].szin || {};

	if (cella.style.backgroundColor=="rgb(0, 255, 0)" || cella.style.backgroundColor=="#00FF00") {
		if (cella.style.border) {
			szin="#f4e4bc";
			cella.style.backgroundColor = szin;
			SZEM4_FARM.DOMINFO_FARMS[koord].szin.fal = '';
			cella.style.border = '';
			SZEM4_FARM.DOMINFO_FARMS[koord].szin.marks = '';
			multipricer("hova","hreset",szin);
		} else {
			szin='blue';
			cella.style.border = `2px solid ${szin}`;
			SZEM4_FARM.DOMINFO_FARMS[koord].szin.marks = szin;
			multipricer("hova","addmark",szin);
		}
	} else {
		cella.style.backgroundColor = szin;
		SZEM4_FARM.DOMINFO_FARMS[koord].szin.fal = szin;
		multipricer("hova","hcser",szin);
	}
	
}
function addFreezeNotification() {
	if (!USER_ACTIVITY) document.getElementById('global_notifications').innerHTML = `<img src="${pic('freeze.png')}" class="rotate" onmouseover="sugo(this,'Amíg SZEM keretrendszert piszkálod, SZEM pihen hogy fókuszálni tudj (automata)')">`;
	USER_ACTIVITY = true;
	clearTimeout(USER_ACTIVITY_TIMEOUT);
	USER_ACTIVITY_TIMEOUT = setTimeout(() => {
		USER_ACTIVITY = false;
		document.getElementById('global_notifications').innerHTML = '';
	}, 5000);
}
function stopEvent(ev) {
	ev.stopImmediatePropagation();
}

var BOTORA, ALTBOT2=false, BOT_VOL=0.0; /*ALTBOT2 --> megnyílt e már 1x az ablak*/
var BOT_REF;
var BOT_NOTIFICATION_SETTINGS = {
	discord: {
		enabled: false,
		webhookUrl: '',
		lastSent: 0
	},
	telegram: {
		enabled: false,
		botToken: '',
		chatId: '',
		repeatCount: 30,
		interval: 1000,
		sentCount: 0
	}
};

function emergencyStopAll() {
	try {
		debug('EMERGENCY STOP', 'Bot protection detected - saving data and stopping all operations');
		
		// Save all data immediately
		naplo('🚨 Emergency', 'Adatok mentése...');
		szem4_ADAT_saveNow('farm');
		szem4_ADAT_saveNow('vije');
		szem4_ADAT_saveNow('epit');
		szem4_ADAT_saveNow('sys');
		szem4_ADAT_saveNow('gyujto');
		
		// Close all bot windows
		const refsToClose = [
			{ ref: 'FARM_REF', name: 'Farmoló' },
			{ ref: 'VIJE_REF1', name: 'Jelentés elemző 1' },
			{ ref: 'VIJE_REF2', name: 'Jelentés elemző 2' },
			{ ref: 'EPIT_REF', name: 'Építő' },
			{ ref: 'GYUJTO_REF', name: 'Gyűjtő' },
			{ ref: 'NORBI0N_FARM_REF', name: 'Norbi0N Farming' }
		];
		
		refsToClose.forEach(item => {
			try {
				if (window[item.ref] && !window[item.ref].closed) {
					window[item.ref].close();
					debug('emergencyStopAll', `${item.name} ablak bezárva`);
				}
			} catch(e) {
				debug('emergencyStopAll', `Nem sikerült bezárni: ${item.name} - ${e}`);
			}
		});
		
		// Stop all worker timers
		worker.postMessage({'id': 'stopTimer', 'value': 'farm'});
		worker.postMessage({'id': 'stopTimer', 'value': 'vije'});
		worker.postMessage({'id': 'stopTimer', 'value': 'epit'});
		worker.postMessage({'id': 'stopTimer', 'value': 'adatok'});
		worker.postMessage({'id': 'stopTimer', 'value': 'gyujto'});
		worker.postMessage({'id': 'stopTimer', 'value': 'norbi0n_farm'});

		// Clear Norbi0N_Farm loop timer and next run
		if (NORBI0N_FARM_LOOP_TIMER) {
			clearTimeout(NORBI0N_FARM_LOOP_TIMER);
			NORBI0N_FARM_LOOP_TIMER = null;
			SZEM4_NORBI0N_FARM.STATS.nextRun = 0;
			debug('emergencyStopAll', 'Norbi0N_Farm loop timer cleared');
		}
		
		// Clear any setTimeout
		if (BOTORA) clearTimeout(BOTORA);
		
		naplo('🚨 Emergency', 'Minden művelet leállítva, adatok mentve');
		
	} catch(e) {
		debug('emergencyStopAll', 'Hiba a leállítás során: ' + e);
	}
}

async function sendBotNotifications(message) {
	const timestamp = new Date().toLocaleString();
	const fullMessage = `🚨 BOT VÉDELEM ÉSZLELVE!\n\nIdő: ${timestamp}\nSzerver: ${game_data.world}\nJátékos: ${game_data.player.name}\n\n${message}`;
	
	// Discord notification
	if (BOT_NOTIFICATION_SETTINGS.discord.enabled && BOT_NOTIFICATION_SETTINGS.discord.webhookUrl) {
		try {
			const now = Date.now();
			// Rate limit: max 1 message per 10 seconds to Discord
			if (now - BOT_NOTIFICATION_SETTINGS.discord.lastSent > 10000) {
				await fetch(BOT_NOTIFICATION_SETTINGS.discord.webhookUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						content: fullMessage,
						username: 'SZEM Bot Alert'
					})
				});
				BOT_NOTIFICATION_SETTINGS.discord.lastSent = now;
				debug('sendBotNotifications', 'Discord értesítés elküldve');
			}
		} catch(e) {
			debug('sendBotNotifications', 'Discord hiba: ' + e);
		}
	}
	
	// Telegram notification (repeated)
	if (BOT_NOTIFICATION_SETTINGS.telegram.enabled && 
		BOT_NOTIFICATION_SETTINGS.telegram.botToken && 
		BOT_NOTIFICATION_SETTINGS.telegram.chatId) {
		
		BOT_NOTIFICATION_SETTINGS.telegram.sentCount = 0;
		
		const sendTelegramMessage = async () => {
			if (BOT_NOTIFICATION_SETTINGS.telegram.sentCount >= BOT_NOTIFICATION_SETTINGS.telegram.repeatCount) {
				debug('sendBotNotifications', `Telegram üzenetek elküldve (${BOT_NOTIFICATION_SETTINGS.telegram.sentCount}/${BOT_NOTIFICATION_SETTINGS.telegram.repeatCount})`);
				return;
			}
			
			try {
				const url = `https://api.telegram.org/bot${BOT_NOTIFICATION_SETTINGS.telegram.botToken}/sendMessage`;
				await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						chat_id: BOT_NOTIFICATION_SETTINGS.telegram.chatId,
						text: `${fullMessage}\n\n[${BOT_NOTIFICATION_SETTINGS.telegram.sentCount + 1}/${BOT_NOTIFICATION_SETTINGS.telegram.repeatCount}]`,
						parse_mode: 'HTML'
					})
				});
				
				BOT_NOTIFICATION_SETTINGS.telegram.sentCount++;
				
				// Schedule next message
				if (BOT_NOTIFICATION_SETTINGS.telegram.sentCount < BOT_NOTIFICATION_SETTINGS.telegram.repeatCount) {
					setTimeout(sendTelegramMessage, BOT_NOTIFICATION_SETTINGS.telegram.interval);
				}
			} catch(e) {
				debug('sendBotNotifications', 'Telegram hiba: ' + e);
			}
		};
		
		sendTelegramMessage();
	}
}

function BotvedelemBe() {
	try {
		let isload = true;
		BOT = true;
		
		// Emergency stop on FIRST detection
		if (!BOTORA) {
			emergencyStopAll();
			sendBotNotifications('CAPTCHA megoldása szükséges a folytatáshoz!');
		}
		
		if (!BOT_REF || BOT_REF.closed) {
			BOT_REF = window.open(VILL1ST);
			isload = false;
			throw "Waiting for auto-resolver...";
		} else if (!(BOT_REF.document.querySelector("#serverTime") && BOT_REF.document.querySelector("#serverTime").innerHTML.length > 4)) {
			isload = false;
		} else if (BOT_REF.document.getElementById('botprotection_quest')) {
			BOT_REF.document.getElementById('botprotection_quest').click();
		} else if (BOT_REF.document.getElementById('bot_check')) {
			if (BOT_REF.document.querySelector('#bot_check a'))
				BOT_REF.document.querySelector('#bot_check a').click();
		}
		if (isload && BOT_REF.document.querySelector('#bot_check') == null && BOT_REF.document.querySelector('#popup_box_bot_protection') == null && BOT_REF.document.querySelector('#botprotection_quest') == null && BOT_REF.document.querySelector('.bot-protection-row') == null) {
			BotvedelemKi();
			return;
		}
		BOT_VOL+=0.2;
		if (BOT_VOL>1.0) BOT_VOL=1.0;
		soundVolume(BOT_VOL);
		playSound("bot2");
		alert2('🚨 BOT VÉDELEM!!! 🚨<br><br>Minden művelet leállítva és adatok mentve!<br>Oldd meg a CAPTCHA-t a megnyitott ablakban, majd kattints ide:<br><br><a href="javascript: BotvedelemKi()">✅ CAPTCHA megoldva, folytatás!</a>');
		if (SZEM4_SETTINGS.altbot && !ALTBOT2) {
			window.open(document.getElementById("altbotURL").value);
			ALTBOT2=true;
		}
	} catch(e){ debug("BotvedelemBe()",e); }

	BOTORA = setTimeout("BotvedelemBe()", 2500);
}
function BotvedelemKi(){
	BOT=false; ALTBOT2=false; BOT_VOL=0.0;
	BOT_REF.close();
	BOT_REF = null;
	document.getElementById("audio1").pause;
	alert2('✅ Bot védelem megoldva!<br><br>Motorok újraindítása...');
	clearTimeout(BOTORA);
	BOTORA = null;
	
	// Restart all motors
	naplo('🔄 Restart', 'Motorok újraindítása...');
	setTimeout(() => {
		szem4_farmolo_motor();
		szem4_VIJE_motor();
		szem4_EPITO_motor();
		szem4_GYUJTO_motor();
		szem4_norbi0n_farm_motor();
		naplo('✅ Restart', 'Minden motor újraindult');
	}, 1000);
	
	/*Megnyitott lapok frissítése*/
	for (const propertyName in window) {
		if (window.hasOwnProperty(propertyName)) {
			const propertyValue = window[propertyName];
			if (propertyName.includes("REF") && isWindowReference(propertyValue) && !propertyValue.closed) {
				try{propertyValue.location.reload();}catch(e){console.error("Not reloadable", propertyName);}
			}
		}
	}
	return;

	function isWindowReference(obj) {
		return obj && typeof obj === "object" && "window" in obj && obj.window === obj;
	}
}

function updateBotNotifications() {
	try {
		// Discord settings
		BOT_NOTIFICATION_SETTINGS.discord.enabled = document.getElementById('discord_enabled').checked;
		BOT_NOTIFICATION_SETTINGS.discord.webhookUrl = document.getElementById('discord_webhook').value;
		
		// Telegram settings
		BOT_NOTIFICATION_SETTINGS.telegram.enabled = document.getElementById('telegram_enabled').checked;
		BOT_NOTIFICATION_SETTINGS.telegram.botToken = document.getElementById('telegram_token').value;
		BOT_NOTIFICATION_SETTINGS.telegram.chatId = document.getElementById('telegram_chatid').value;
		BOT_NOTIFICATION_SETTINGS.telegram.repeatCount = parseInt(document.getElementById('telegram_repeat').value, 10) || 30;
		BOT_NOTIFICATION_SETTINGS.telegram.interval = parseInt(document.getElementById('telegram_interval').value, 10) || 1000;
		
		// Save to settings
		SZEM4_SETTINGS.bot_notifications = JSON.parse(JSON.stringify(BOT_NOTIFICATION_SETTINGS));
		saveSettings();
		
		debug('updateBotNotifications', 'Értesítési beállítások frissítve');
	} catch(e) {
		debug('updateBotNotifications', 'Hiba: ' + e);
	}
}

function loadBotNotifications() {
	try {
		if (SZEM4_SETTINGS.bot_notifications) {
			BOT_NOTIFICATION_SETTINGS = JSON.parse(JSON.stringify(SZEM4_SETTINGS.bot_notifications));
			
			// Load to UI
			document.getElementById('discord_enabled').checked = BOT_NOTIFICATION_SETTINGS.discord.enabled;
			document.getElementById('discord_webhook').value = BOT_NOTIFICATION_SETTINGS.discord.webhookUrl || '';
			document.getElementById('telegram_enabled').checked = BOT_NOTIFICATION_SETTINGS.telegram.enabled;
			document.getElementById('telegram_token').value = BOT_NOTIFICATION_SETTINGS.telegram.botToken || '';
			document.getElementById('telegram_chatid').value = BOT_NOTIFICATION_SETTINGS.telegram.chatId || '';
			document.getElementById('telegram_repeat').value = BOT_NOTIFICATION_SETTINGS.telegram.repeatCount || 30;
			document.getElementById('telegram_interval').value = BOT_NOTIFICATION_SETTINGS.telegram.interval || 1000;
			
			debug('loadBotNotifications', 'Értesítési beállítások sikeresen betöltve');
		} else {
			debug('loadBotNotifications', 'Nincs mentett értesítési beállítás');
		}
	} catch(e) {
		debug('loadBotNotifications', 'Hiba: ' + e);
	}
}

function testBotNotifications() {
	try {
		updateBotNotifications();
		sendBotNotifications('🧪 TESZT ÜZENET - Ez egy teszt értesítés a SZEM bot rendszerből.');
		alert2('✅ Teszt értesítés elküldve!<br><br>Ellenőrizd a Discord vagy Telegram alkalmazásod.');
	} catch(e) {
		alert2('❌ Hiba: ' + e);
	}
}

function isPageLoaded(ref, faluid, address, elements=[]){try{
	if (ref.closed) return false;
	// Enhanced bot detection - checks multiple elements
	const botDetectionElements = [
		ref.document.getElementById('botprotection_quest'),
		ref.document.getElementById('bot_check'),
		ref.document.getElementById('popup_box_bot_protection'),
		ref.document.querySelector('.bot-protection-row'),  // New detection
		ref.document.querySelector('td.bot-protection-row'), // Alternative selector
		ref.document.title == "Bot védelem"
	];
	
	if (botDetectionElements.some(el => el)) {
		try{if (ref.document.getElementById('botprotection_quest')) ref.document.getElementById('botprotection_quest').click();}catch(e){}
		naplo("Globális","🚨 Bot védelem aktív!!!");
		document.getElementById("audio1").volume=0.2;
		BotvedelemBe();
		return false;
	}
	if (ref.document.location.href.indexOf("sid_wrong")>-1) {
		naplo("Globális","Kijelentkezett fiók. Jelentkezzen be újra, vagy állítsa le a programot.");
		BotvedelemBe();
		return false;
	}
	if (!address) return false;
	for (let i=0; i < elements.length; i++) {
		if (ref.document.querySelector(elements[i]) === null) return false;
	}
	if (address.indexOf("not ")>-1) var neg=true; else var neg=false;
	if (faluid>-1) if (ref.game_data.village.id!=faluid) return false;
	if (ref.document.getElementById("serverTime").innerHTML.length>4) {
		if (neg) {
			if (ref.document.location.href.indexOf(address.split(" ")[1]) == -1) return true;
		} else {
			if (ref.document.location.href.indexOf(address)>-1)	return true;
		}
	}
	return false;
}catch(e){return false;}}
function windowOpener(id, url, windowId) {
	return window.open(url, windowId);
}
function addTooltip(el, text) {
	removeTooltip(el.closest('.tooltip-wrapper'));
	$(el).children('.tooltip_text').css({"display": "block"})
	$(el).children('.tooltip_text').html(text);
}
function addTooltip_build(el, koord) {
	removeTooltip(el.closest('.tooltip-wrapper'));
	el.querySelector('.tooltip_text').style.display = "block";

	const isNew = koord in SZEM4_VIJE.ALL_VIJE_SAVED;
	if (isNew) el.querySelector('.tooltip_text').classList.remove('szem_old_build_tooltip'); else el.querySelector('.tooltip_text').classList.add('szem_old_build_tooltip');
	let buildingTooltip = `<table class="no-bg-table">`;
	const i18nBuildings=document.getElementById("vije_opts");
	for (build in SZEM4_FARM.DOMINFO_FARMS[koord].buildings) {
		if (SZEM4_FARM.DOMINFO_FARMS[koord].buildings[build] < 1) continue;
		buildingTooltip += `<tr><td>${i18nBuildings[build].value}:</td><td>${SZEM4_FARM.DOMINFO_FARMS[koord].buildings[build]}</td></tr>`
	}
	buildingTooltip += '</table>';
	buildingTooltip += `<br><i>Felderítés ideje:<br>${isNew ? new Date(SZEM4_VIJE.ALL_VIJE_SAVED[koord]).toLocaleString() : 'Ismeretlen/régi'}</i>`
	el.querySelector('.tooltip_text').innerHTML = buildingTooltip;
}
function removeTooltip(el) {
	$(el).find('.tooltip_hover').each(function(i, el) {
		var thisText = $(el).children('.tooltip_text').html();
		if (thisText == "") return;
		$(el).children('.tooltip_text').html("");
		$(el).children('.tooltip_text').css({"display": "none"});
	});
}
function switchMobileMode() {
	MOBILE_MODE = !MOBILE_MODE;
	alert(`Mobile Mode = ${MOBILE_MODE}`);
}
function saveSettings() {
	const allOptions = document.getElementById('settings');
	Array.from(allOptions.elements).forEach((inputEl) => {
		if (inputEl.name) {
			if (inputEl.type === 'checkbox') {
				SZEM4_SETTINGS[inputEl.name] = inputEl.checked;
			} else if (inputEl.value) {
				SZEM4_SETTINGS[inputEl.name] = inputEl.value;
			}
		}
	});

	//Save Theme
	let themeId = SZEM4_SETTINGS.selectedProfile;
	if (themeId == undefined || isNaN(themeId) || themeId < 0 || themeId > 4) themeId = 1;
	const saveObj = SZEM4_SETTINGS[`profile${themeId}`];
	const themeOptions = document.querySelectorAll('#settings .style-settings-table input');
	themeOptions.forEach((inputEl) => {
		if (inputEl.name) {
			if (inputEl.type === 'checkbox') {
				saveObj[inputEl.name] = inputEl.checked;
			} else if (inputEl.value) {
				saveObj[inputEl.name] = inputEl.value;
			}
		}
	});
}
function loadSettings() {
	const allOptions = document.getElementById('settings');
	Array.from(allOptions.elements).forEach((input) => {
		if (input.name && SZEM4_SETTINGS[input.name] !== undefined) {
			if (input.type === 'checkbox') {
				input.checked = SZEM4_SETTINGS[input.name];
			} else if (input.value) {
				input.value = SZEM4_SETTINGS[input.name];
			}
		}
	});
	selectTheme(SZEM4_SETTINGS.selectedProfile);
	
	// Load bot notification settings after SZEM4_SETTINGS is loaded
	loadBotNotifications();
}

function restartKieg(type) {
	worker.postMessage({'id': 'stopTimer', 'value': type});
	setTimeout(function() {
		switch (type) {
			case 'farm': szem4_farmolo_motor(); break;
			case 'vije': szem4_VIJE_motor(); break;
			case 'epit': szem4_EPITO_motor(); break;
			case 'recruitment': szem4_recruitment_motor(); break;
		}
	}, 133);
}
function sendCustomEvent(messageId, data={}) {
	const customEvent = new CustomEvent(messageId, {
		detail: data
	});
	document.dispatchEvent(customEvent);
}
/* ------------------- FARMOLÓ ----------------------- */
function drawWagons(koord) {
	let farms = document.getElementById('farm_hova').rows;
	if (!koord) {
		for (var i=1;i<farms.length;i++) {
			addWagons(farms[i]);
		}
	} else {
		for (var i=1;i<farms.length;i++) {
			if (farms[i].cells[0].textContent == koord) {
				addWagons(farms[i]);
				break;
			}
		}
	}
}
function addWagons(farmRow) {
	let koord = farmRow.cells[0].textContent;
	let attacks = SZEM4_FARM.ALL_UNIT_MOVEMENT[koord];
	
	farmRow.cells[5].innerHTML = ''; // Fixme: Nem csak ez van (Why? lesz?) itt, ne töröld az egészet
	if (!attacks) return;
	attacks.sort((a, b) => a[1] - b[1]);
	const tmp = document.createElement('div');
	tmp.setAttribute('class', 'tooltip-wrapper');
	let tmp_content = '';
	let prodHour = SZEM4_FARM.DOMINFO_FARMS[koord].prodHour;
	attacks.forEach((attack, index) => {
		let wagonType = 'wagon_normal.png';
		if (attack[2] > (prodHour * 5)) wagonType = 'wagon_nuclear.png';
		else if (attack[2] > (prodHour * 2)) wagonType = 'wagon_coal.png';
		else if (attack[2] < 5 && attack[0] < 5) wagonType = 'wagon_empty.png';

		let min = Math.round(convertTbToTime(farmRow.cells[1].textContent, attack[0]));
		tmp_content += `
		<span onmouseenter="setTooltip(this, ${index})" class="tooltip_hover">
			<img src="${pic(wagonType)}?v=4" title="" width="40px">
			<span class="wagon_time">${(min>3 && wagonType!='wagon_nuclear.png')?min:''}</span>
			<span class="tooltip_text"></span>
		</span>`
	});
	tmp.innerHTML = tmp_content;
	farmRow.cells[5].appendChild(tmp);
}
function setTooltip(el, index) {
	let farmRow = el.closest('tr');
	let farmCoord = farmRow.cells[0].textContent;
	let attack = [...SZEM4_FARM.ALL_UNIT_MOVEMENT[farmCoord][index]];
	let min = convertTbToTime(farmRow.cells[1].textContent, attack[0]);
	let kezdet = new Date(attack[1]);
	kezdet.setSeconds(kezdet.getSeconds() - (min * 60));
	min = min.toFixed(2);

	let content = `<table class="no-bg-table">
		<tr><td>Szerelvény hossza</td><td><div class="flex_middle">${min} perc (<img src="${pic('resource.png')}"> ${attack[0]})</div></td></tr>
		<tr><td>Szerelvény kezdete</td><td>${kezdet.toLocaleString()}</td></tr>
		<tr><td>Érkezés</td><td>${new Date(attack[1]).toLocaleString()}</td></tr>
		<tr><td>Extra nyers</td><td><div class="flex_middle"><img src="${pic('resource.png')}"> ${attack[2]}</div></td></tr>
		<tr><td>Nyerstermelés/óra</td><td>${getProdHour(farmRow.cells[1].textContent)}</td></tr>
	</table>
	<i>Utolsó jelentés: ${SZEM4_VIJE.ALL_VIJE_SAVED[farmCoord] ? new Date(SZEM4_VIJE.ALL_VIJE_SAVED[farmCoord]).toLocaleString() : 'Nincs'}</i>`;
	addTooltip(el, content);
}
function add_farmolando(){try{
	let addFarmolandoFaluk = document.getElementById('add_farmolando_faluk');
	var faluk = addFarmolandoFaluk.value;
	if (faluk == '') return;
	var patt = new RegExp(/[0-9]+(\|)[0-9]+/);
	if (!patt.test(faluk)) throw "Nincs érvényes koordináta megadva";
	faluk = faluk.match(/[0-9]+(\|)[0-9]+/g);
	
	var dupla='';
	let defaultProdHour = parseInt(document.getElementById('farmolo_options').termeles.value,10);
	for (var i=0;i<faluk.length;i++) {
		if (SZEM4_FARM.DOMINFO_FARMS[faluk[i]] || SZEM4_FARM.DOMINFO_FROM[faluk[i]]) {
			dupla+=faluk[i] + ', ';
			faluk[i] = '';
			continue;
		}
		const a=document.getElementById("farm_hova");
		const a_row=a.insertRow(-1); 
		var c=a_row.insertCell(0); c.innerHTML=faluk[i]; c.setAttribute("ondblclick","hattertolor(this)");
		var c=a_row.insertCell(1); c.innerHTML=""; c.setAttribute("ondblclick",'sortorol(this,"hova")');
		var c=a_row.insertCell(2);
			c.innerHTML=`<span class="tooltip_hover">
				0
				<span class="tooltip_text"></span>
			</span>`;
			c.setAttribute("ondblclick","hattercsere(this)");
			c.setAttribute("onclick","learnCatapult(this)");
			c.setAttribute("onmouseenter",`addTooltip_build(this, '${faluk[i]}')`);
			c.setAttribute("onmouseleave",'removeTooltip(this)');
		var c=a_row.insertCell(3); c.innerHTML="0"; c.setAttribute("ondblclick",'modosit_szam(this)');
		var c=a_row.insertCell(4); c.innerHTML='<input type="checkbox" onclick="szem4_farmolo_multiclick(0,\'hova\',this.checked)">';
		var c=a_row.insertCell(5); c.innerHTML=""; c.setAttribute("onmouseleave",'removeTooltip(this)');
		SZEM4_FARM.DOMINFO_FARMS[faluk[i]] = {
			prodHour: defaultProdHour,
			buildings: {},
			nyers: 0,
			szin: {
				falu: '',
				fal: '',
				marks: ''
			},
			isJatekos: false
		};
	}
		
	addFarmolandoFaluk.value="";
	let text = '';
	if (Object.keys(SZEM4_FARM.DOMINFO_FARMS).length > 200) {
		text += 'Túl sok farm, csak az első 200-at jelenítem meg (ettől még aktívak és szűrhetőek/rendezhetőek)\n';
	}
	hideFarms();
	if (dupla!="") text+='Dupla falumegadások kiszűrve:\n' + dupla;
	if (text !== '') alert2(text);
	return;	
}catch(e){alert(e);}}
function add_farmolo(){ try{
	const addFaluk = document.getElementById('add_farmolo_faluk');
	let faluk = addFaluk.value;
	if (faluk == '') return;
	const patt = new RegExp(/[0-9]+(\|)[0-9]+/);
	if (!patt.test(faluk)) throw "Nincs érvényes koordináta megadva";
	faluk = faluk.match(/[0-9]+(\|)[0-9]+/g);
	
	if (!document.querySelector('#add_farmolo_egysegek input:checked')) {
		if (!confirm('Nincs semmilyen egység megadva, amit küldhetnék. Folytatod?\n(később ez a megadás módosítható)')) return;
	}
	
	for (var i=0;i<faluk.length;i++) {
		if (!SZEM4_FARM.DOMINFO_FROM[faluk[i]] && KTID[faluk[i]]) {
			SZEM4_FARM.DOMINFO_FROM[faluk[i]] = {
				isUnits: {},
				noOfUnits: {}
			};
			document.querySelectorAll('#add_farmolo_egysegek input').forEach((el) => {
				SZEM4_FARM.DOMINFO_FROM[faluk[i]].isUnits[el.name] = el.checked;
				SZEM4_FARM.DOMINFO_FROM[faluk[i]].noOfUnits[el.name] = 999;
			});

			debug('add_farmolo', `Calling add_attackerRow with ${faluk[i]}`);
			add_attackerRow(faluk[i]);
		}
	}
	addFaluk.value="";
	return;	
} catch(e) {
	alert(e);
}}

/**
 * @description Limitálja hogy max 200 farm jelenjen meg egyszerre, performancia okok végett
 */
function hideFarms() {
	const allFarm = document.getElementById('farm_hova').rows;
	let visible = 0;
	for (let i=0;i<allFarm.length;i++) {
		if (allFarm[i].style.display !== 'none') visible++;
		if (visible > 200) allFarm[i].classList.add('szem4_farms_overflow'); else allFarm[i].classList.remove('szem4_farms_overflow');
	}
}

function add_attackerRow(attackerCoord) {
	debug('add_attackerRow', `Added new vill ${attackerCoord}`);
	const attackerRow = document.querySelector(`#ffrom_${attackerCoord.replace('|','-')}`);
	if (!attackerRow) {
		// CREATE
		const a = document.getElementById("farm_honnan");
		const b = a.insertRow(-1);
		b.setAttribute('id', `ffrom_${attackerCoord.replace('|','-')}`);
		let c = b.insertCell(0);
		c.innerHTML = attackerCoord;
		c.setAttribute("ondblclick",'sortorol(this,"honnan")');
	
		c = b.insertCell(1);
		c.innerHTML = rovidit("egysegek");
		c.querySelectorAll('input').forEach((el) => {
			el.checked = SZEM4_FARM.DOMINFO_FROM[attackerCoord].isUnits[el.name];
		});
	} else {
		// UPDATE (Not a valid case)
		debug('add_attackerRow', 'Invalid case: No update possible');
	}
}

function rebuildDOM_farm() {try{
	// BEÁLLÍTÁSOK
	const optsForm = document.querySelector('#farmolo_options');
	for (const el of optsForm) {
		if (!el.name || SZEM4_FARM.OPTIONS[el.name] == undefined) continue;
		if (el.type == 'checkbox') {
			el.checked = SZEM4_FARM.OPTIONS[el.name];
		} else {
			el.value = SZEM4_FARM.OPTIONS[el.name];
		}
	}

	// FARMOLÓ FALUK
	$("#farm_honnan tr:gt(0)").remove();
	for (attacker in SZEM4_FARM.DOMINFO_FROM) {
		add_attackerRow(attacker);
	}
	debug('rebuildDOM_farm', '(1) Loading debug: FROM = ' + JSON.stringify(SZEM4_FARM.DOMINFO_FROM));

	// FARMOK
	const farmTable = document.getElementById('farm_hova');
	$("#farm_hova tr:gt(0)").remove();
	for (farm in SZEM4_FARM.DOMINFO_FARMS) {
		SZEM4_FARM.DOMINFO_FARMS[farm].szin = SZEM4_FARM.DOMINFO_FARMS[farm].szin || {};
		const a_row = farmTable.insertRow(-1);
		// HOVA
		let c = a_row.insertCell(0);
		c.innerHTML=farm;
		c.setAttribute("ondblclick","hattertolor(this)");
		if (SZEM4_FARM.DOMINFO_FARMS[farm].szin.falu) c.style.backgroundColor = SZEM4_FARM.DOMINFO_FARMS[farm].szin.falu;
		
		// BÁNYÁK
		const buildings = SZEM4_FARM.DOMINFO_FARMS[farm].buildings;
		c=a_row.insertCell(1);
		if (buildings.wood == undefined) {
			SZEM4_FARM.DOMINFO_FARMS[farm].prodHour = parseInt(document.getElementById('farmolo_options').termeles.value, 10);
		} else {
			let banyak = `${buildings.wood},${buildings.stone},${buildings.iron}`;
			c.innerHTML=`${banyak}`;
			SZEM4_FARM.DOMINFO_FARMS[farm].prodHour = getProdHour(banyak);
		}
		c.style.backgroundColor = SZEM4_FARM.DOMINFO_FARMS[farm].szin.banya;
		c.setAttribute("ondblclick",'sortorol(this,"hova")');
		
		// FAL
		c=a_row.insertCell(2);
		let fal = '';
		if (buildings.wall !== undefined) {
			fal = parseInt(buildings.wall,10);
			if (fal == 0) {
				if (buildings.main == 1) fal -= 2;
				if (buildings.main == 2) fal -= 1;
				if (buildings.barracks == 0) fal -= 1;
			}
		}
		c.innerHTML=`<span class="tooltip_hover">
			${fal}
			<span class="tooltip_text"></span>
		</span>`;
		c.setAttribute("onmouseenter",`addTooltip_build(this, '${farm}')`);
		c.setAttribute("ondblclick","hattercsere(this)");
		c.setAttribute("onclick","learnCatapult(this)");
		c.setAttribute("onmouseleave",'removeTooltip(this)');
		if (SZEM4_FARM.DOMINFO_FARMS[farm].szin.fal) c.style.backgroundColor = SZEM4_FARM.DOMINFO_FARMS[farm].szin.fal;
		if (SZEM4_FARM.DOMINFO_FARMS[farm].szin.marks) c.style.border = `2px solid ${SZEM4_FARM.DOMINFO_FARMS[farm].szin.marks}`;
		
		// NYERS
		c=a_row.insertCell(3); c.innerHTML=SZEM4_FARM.DOMINFO_FARMS[farm].nyers; c.setAttribute("ondblclick",'modosit_szam(this)');
		
		// J?
		c=a_row.insertCell(4); c.innerHTML=`<input type="checkbox" onclick="szem4_farmolo_multiclick(0,\'hova\',this.checked)" ${SZEM4_FARM.DOMINFO_FARMS[farm].isJatekos?'checked':''}>`;
		
		// WAGONS
		c=a_row.insertCell(5); c.innerHTML=""; c.setAttribute("onmouseleave",'removeTooltip(this)');
		drawWagons(farm);
	}
	hideFarms();
	debug('rebuildDOM_farm', '(2) Loading debug: FROM = ' + JSON.stringify(SZEM4_FARM.DOMINFO_FROM));
} catch(e) {
	debug('rebuildDOM_farms', e);
	alert2('ERROR__ rebuild: \n' + e);
}}

function learnCatapult(el){
	let coord = el.closest('tr').cells[0].textContent;
	let toCatapult = {};
	const ignoreCatapult=['wood', 'stone', 'iron', 'wall'];
	const i18nBuildings=document.getElementById("vije_opts");
	for (b in SZEM4_FARM.DOMINFO_FARMS[coord].buildings) {
		if (ignoreCatapult.includes(b) || SZEM4_FARM.DOMINFO_FARMS[coord].buildings[b] == 0) continue;
		toCatapult[i18nBuildings[b].value] = SZEM4_FARM.DOMINFO_FARMS[coord].buildings[b];
	}
	alert2(`Katapultozó script betanítva \n ${coord}`);
	console.info(coord, toCatapult);
	localStorage.setItem('cnc_katapult', `;${coord};${JSON.stringify(toCatapult)}`);
}

function szem4_farmolo_multiclick(no,t,mire){try{
	if (!(document.getElementById("farm_multi_"+t).checked)) return;
	var x=document.getElementById("farm_"+t).rows;
	if (t=="honnan") t=1; else t=4;
	for (var i=1;i<x.length;i++) {
		if (x[i].style.display!="none") x[i].cells[t].getElementsByTagName("input")[no].checked=mire;
	}
	return;
}catch(e){alert2("Hiba: "+t+"-"+no+"\n"+e);}}
function szem4_farmolo_csoport(tabla){try{
	var lista = prompt("Faluszűrő\nAdd meg azon faluk koordinátáit, melyeket a listában szeretnél látni. A többi falu csupán láthatatlan lesz, de tovább folyik a használata.\nSpeciális lehetőségid:\n-1: Csupán ezt az értéket adva meg megfordítódik a jelenlegi lista láthatósága (negáció)\n-...: Ha az első karakter egy - jel, akkor a felsorolt faluk kivonódnak a jelenlegi listából (különbség)\n+...: Ha az első karaktered +, akkor a felsorolt faluk hozzáadódnak a listához (unió)\nÜresen leokézva az összes falu láthatóvá válik");
	if (lista==null) return;
	var type="norm";
	if (lista=="-1") type="negalt";
		else {
			if (lista[0]=="-") type="kulonbseg";
			if (lista[0]=="+") type="unio";
		}
	if (lista=="") type="all";
	if (lista=="S") type="yellow";
	lista=lista.match(/[0-9]+(\|)[0-9]+/g);
	var uj=false; var jel;
	var x=document.getElementById("farm_"+tabla).rows;
	for (var i=1;i<x.length;i++) {
		uj=false; jel=x[i].cells[0].textContent;
		switch(type) {
			case "norm": if (lista.indexOf(jel)>-1) uj=true; break;
			case "negalt": if (x[i].style.display=="none") uj=true; break;
			case "kulonbseg": if (x[i].style.display!="none" && lista.indexOf(jel)==-1) uj=true; break;
			case "unio": if (x[i].style.display!="none" || lista.indexOf(jel)>-1) uj=true; break;
			case "all": uj=true; break;
			case "yellow": if (x[i].cells[0].style.backgroundColor=="yellow") uj=true; break;
		}
		if (uj) x[i].setAttribute("style","display:line"); else x[i].setAttribute("style","display:none");
	}
	hideFarms();
}catch(e){alert2("Hiba: \n"+e);}}
function getAllResFromVIJE(coord) {
	var allAttack = SZEM4_FARM.ALL_UNIT_MOVEMENT[coord];
	if (!allAttack) return 0;
	var allRes = 0;
	for (let att in allAttack) {
		allRes+=allAttack[att][2];
	}

	if (isNaN(allRes)) {debug('getAllResFromVIJE', 'allRes is NaN at ' + coord + ': ' + JSON.stringify(allAttack)); return 0;}
	return allRes;
}
function subtractNyersValue(coord, val) {
	var nyersTable = document.getElementById('farm_hova').rows;
	var cells;
	for (var i=1;i<nyersTable.length;i++) {
		cells = nyersTable[i].cells;
		if (cells[0].textContent == coord) {
			var oldValue = parseInt(cells[3].innerText,10);
			oldValue-=val;
			if (oldValue<0) oldValue=0;
			cells[3].innerHTML = oldValue;
			SZEM4_FARM.DOMINFO_FARMS[coord].nyers = oldValue;
			break;
		}
	}
}
function clearAttacks() {try{
	const currentTime = getServerTime().getTime();
	for (let item in SZEM4_FARM.ALL_UNIT_MOVEMENT) {
		// Current utáni érkezések kivágása
		var outdatedArrays = [];
		for (var i=SZEM4_FARM.ALL_UNIT_MOVEMENT[item].length-1;i>=0;i--) {
			// Ha VIJE nyersért ment csak, töröljük
			if (SZEM4_FARM.ALL_UNIT_MOVEMENT[item][i][1] <= currentTime && SZEM4_FARM.ALL_UNIT_MOVEMENT[item][i][0] < 30) {
				subtractNyersValue(item, SZEM4_FARM.ALL_UNIT_MOVEMENT[item][i][2]);
				SZEM4_FARM.ALL_UNIT_MOVEMENT[item].splice(i, 1);
				drawWagons(item);
				continue;
			}
			if (SZEM4_FARM.ALL_UNIT_MOVEMENT[item][i][1] <= currentTime - (MAX_IDO_PERC * 60000 * 2)) { // Kuka, ha nagyon régi
				SZEM4_FARM.ALL_UNIT_MOVEMENT[item].splice(i, 1);
				drawWagons(item);
				continue;
			}
			if (SZEM4_FARM.ALL_UNIT_MOVEMENT[item][i][1] <= currentTime) outdatedArrays.push(SZEM4_FARM.ALL_UNIT_MOVEMENT[item][i]);
		}
		// Beérkezett támadások nyerstörlése
		if (!outdatedArrays) continue;
		for (let movement of outdatedArrays) {
			if (movement.length != 3) {
				debug('clearAttacks', 'Anomaly, nem szabályszerű mozgás ('+item+'):'+JSON.stringify(movement)+' -- össz:'+JSON.stringify(outdatedArrays));
			}
			if (movement[2] > 0) {
				subtractNyersValue(item, movement[2]);
				movement[2] = 0;
			}
		}

		if (outdatedArrays.length < 2) continue;
		// Leghamarábbi keresése
		var closestArray = outdatedArrays.reduce(function(prev, current) {
			return (current[1] > prev[1]) ? current : prev;
		}, outdatedArrays[0]);

		SZEM4_FARM.ALL_UNIT_MOVEMENT[item] = SZEM4_FARM.ALL_UNIT_MOVEMENT[item].filter(function(array) {
			return array[1] >= closestArray[1];
		});
		drawWagons(item);
	}
	for (let item in SZEM4_VIJE.ALL_VIJE_SAVED) {
		if (SZEM4_VIJE.ALL_VIJE_SAVED[item] < currentTime - (3 * 60 * 60000)) {
			subtractNyersValue(item, 400000);
			delete SZEM4_VIJE.ALL_VIJE_SAVED[item];
		}
	}
}catch(e) {debug('clearAttacks', e);}}

function getProdHour(banyaszintek) {
	var prodHour = 0;
	if (banyaszintek.split(',').length < 3) {
		prodHour=document.getElementById("farmolo_options").termeles.value;
		if (prodHour != "") prodHour = parseInt(prodHour, 10); else prodHour = 1000;
	} else {
		var r=banyaszintek.split(",").map(item => parseInt(item, 10));
		prodHour=(TERMELES[r[0]]+TERMELES[r[1]]+TERMELES[r[2]])*SPEED;
	}
	return parseFloat(prodHour.toFixed(2),10);
}
function updateDefaultProdHour() {
	const newProdHour = parseInt(document.getElementById('farmolo_options').termeles.value, 10);
	for (koord in SZEM4_FARM.DOMINFO_FARMS) {
		if (SZEM4_FARM.DOMINFO_FARMS[koord].buildings.iron || SZEM4_FARM.DOMINFO_FARMS[koord].buildings.stone || SZEM4_FARM.DOMINFO_FARMS[koord].buildings.wood) continue;
		SZEM4_FARM.DOMINFO_FARMS[koord].prodHour = newProdHour;
	}
}
function getResourceProduction(prodHour, idoPerc) {try{
	// idoPerc alatt termelt mennyiség. idoperc MAX=megbízhatósági idő, vagy amennyi idő megtermelni határszám-nyi nyerset
	// var corrigatedMaxIdoPerc = getCorrigatedMaxIdoPerc(banyaszintek);
	if (idoPerc == 'max') idoPerc = parseInt(document.getElementById('farmolo_options').megbizhatosag.value, 10);
	// if (idoPerc == 'max') idoPerc = corrigatedMaxIdoPerc;

	var idoOra = idoPerc/60;
	return Math.round(prodHour * idoOra);
}catch(e) {debug('getResourceProduction', e);}}
function convertTbToTime(banyaszintek, tb) {
	var termeles = getProdHour(banyaszintek); // 1000 
	var idoPerc = (tb / termeles) * 60;
	return idoPerc;
}
function calculateNyers(farmCoord, travelTimeMinutes) {try{
	// Kiszámolja a többi támadásokhoz képest, mennyi a lehetséges nyers, kivonva amiért már megy egység.
	// Az érkezési idő +-X perc közötti rablási lefedettséget néz
	var foszthatoNyers = 0;
	var arriveTime = getServerTime();
	arriveTime.setSeconds(arriveTime.getSeconds() + (travelTimeMinutes * 60));
	arriveTime = arriveTime.getTime();
	if (!SZEM4_FARM.ALL_UNIT_MOVEMENT[farmCoord]) {
		foszthatoNyers = getResourceProduction(SZEM4_FARM.DOMINFO_FARMS[farmCoord].prodHour, 'max');
		return foszthatoNyers;
	}
	allAttack = SZEM4_FARM.ALL_UNIT_MOVEMENT[farmCoord];
	// Vonat:   [ ---- lastBefore ----|]        [ ---- firstAfter ---- |]
	//                         [ ---- arriveTime ----|]
	var closests = findClosestTimes(allAttack, arriveTime);
	var lastBefore = closests[0],
		firstAfter = closests[1];
	if (lastBefore) {
		foszthatoNyers+=getResourceProduction(SZEM4_FARM.DOMINFO_FARMS[farmCoord].prodHour, (arriveTime - lastBefore[1]) / 60000);
	} else {
		foszthatoNyers+=getResourceProduction(SZEM4_FARM.DOMINFO_FARMS[farmCoord].prodHour, 'max');
	}

	if (firstAfter) {
		let prodHour = SZEM4_FARM.DOMINFO_FARMS[farmCoord].prodHour;
		let minimumFrom = 0;

		for (let i=0; i<allAttack.length; i++) {
			if (allAttack[i][1] > arriveTime) {
				let lefedesIdo = (allAttack[i][0] / prodHour) * 60 * 60000
				let from = allAttack[i][1] - lefedesIdo;
				if (minimumFrom == 0 || minimumFrom > from) minimumFrom = from;
			}
		}
		if (minimumFrom < arriveTime)
			foszthatoNyers -= getResourceProduction(SZEM4_FARM.DOMINFO_FARMS[farmCoord].prodHour, (arriveTime - minimumFrom) / 60000);
	}
	return foszthatoNyers;
}catch(e) {debug('calculateNyers', e);}}
function findClosestTimes(allAttack, arriveTime) {
	let lastBefore = null;
	let firstAfter = null;

	for (let i=0; i<allAttack.length; i++) {
		if (allAttack[i][0] < 50) continue;
		let d = allAttack[i][1];
		if (d < arriveTime) {
			if (!lastBefore || d > lastBefore[1]) lastBefore = allAttack[i];
		} else if (d > arriveTime) {
			if (!firstAfter || d < firstAfter[1]) firstAfter = allAttack[i];
		}
	}

	return [lastBefore, firstAfter];
}
function addCurrentMovementToList(formEl, farmCoord, farmHelyRow) {try{
	var patternOfIdo = /<td>[0-9]+:[0-9]+:[0-9]+<\/td>/g;
	var travelTime = formEl.innerHTML.match(patternOfIdo)[0].match(/[0-9]+/g);
	travelTime = parseInt(travelTime[0],10) * 3600 + parseInt(travelTime[1],10) * 60 + parseInt(travelTime[2],10);
	var arriveTime = getServerTime();
	arriveTime.setSeconds(arriveTime.getSeconds() + travelTime);
	arriveTime = arriveTime.getTime();

	var teherbiras = parseInt(formEl.querySelector('.icon.header.ressources').parentElement.innerText.replaceAll('.',''), 10);
	var VIJE_teher = 0;
	var VIJE_nyers = SZEM4_FARM.DOMINFO_FARMS[farmCoord].nyers;
	if (VIJE_nyers > 0) {
		VIJE_nyers-=getAllResFromVIJE(farmCoord);
		if (VIJE_nyers > 0) {
			VIJE_teher = Math.min(teherbiras, VIJE_nyers);
			teherbiras-=VIJE_teher;
		}
	}

	if (teherbiras < 10 && VIJE_teher < 10) {
		debug('addCurrentMovementToList', `ERROR: ${formEl.querySelector('.icon.header.ressources').parentElement.innerText} -- teherbírás=0; Farm: ${farmCoord} | Innen: ${FARM_REF.game_data.village.display_name}`);
	}
	var allAttack = SZEM4_FARM.ALL_UNIT_MOVEMENT[farmCoord];
	if (!allAttack) {
		SZEM4_FARM.ALL_UNIT_MOVEMENT[farmCoord] = [[teherbiras, arriveTime, VIJE_teher]];
	} else {
		allAttack.push([teherbiras, arriveTime, VIJE_teher]);
	}
	addWagons(farmHelyRow);
	// KÉM?
	if (!FARM_REF.document.getElementById('place_confirm_units').querySelector('[data-unit="spy"]').getElementsByTagName('img')[0].classList.contains('faded')) {
		if (!SZEM4_FARM.ALL_SPY_MOVEMENTS[farmCoord] || SZEM4_FARM.ALL_SPY_MOVEMENTS[farmCoord] < arriveTime) SZEM4_FARM.ALL_SPY_MOVEMENTS[farmCoord] = arriveTime;
	}
}catch(e) {debug('addCurrentMovementToList', e); console.error(e);}}

function planAttack(farmRow, nyers_VIJE, bestSpeed, hatarszam) {try{
	// Megtervezi, miből mennyit küldjön SZEM. Falu megnyitása után intelligensen még módosíthatja ezt (2. lépés) (nem változtatva a MAX_SPEED-et)
	const farmCoord = farmRow.cells[0].textContent;
	const allOptions = document.getElementById('farmolo_options');
	const minSereg = parseInt(allOptions.minsereg.value, 10);
	const maxTavPerc = parseInt(allOptions.maxtav_ora.value, 10) * 60 + parseInt(allOptions.maxtav_p.value, 10);
	let plan = {};

	for (attacker in SZEM4_FARM.DOMINFO_FROM) {
		let unifiedTraverTime = (1/SPEED)*(1/UNIT_S);
		unifiedTraverTime = unifiedTraverTime*(distCalc(farmCoord.split("|"), attacker.split("|"))); /*a[i]<->fromVillRow távkeresés*/
		
		// Távolásszűrő: MAX távon belüli, legjobb?
		let priority = getSlowestUnit(SZEM4_FARM.DOMINFO_FROM[attacker]);
		if (priority == '') continue;
		while(true) {
			if (unifiedTraverTime * E_SEB[priority] > maxTavPerc) {
				if (priority == 'heavy') {
					if (unifiedTraverTime * E_SEB.light > maxTavPerc) break;
					priority = 'light'; // Talán!
				} else if (priority == 'sword') {
					if (unifiedTraverTime * E_SEB.spear > maxTavPerc) break;
					priority = 'spear'; // Talán!
				} else break;
			}
			let myTime = unifiedTraverTime * E_SEB[priority];
			if (bestSpeed !== -1 && myTime > bestSpeed) break;

			// Mennyi nyerset tudnék hozni? Határszámon belül van?
			let nyers_termeles = calculateNyers(farmCoord, myTime);
			if (isNaN(nyers_termeles)) { nyers_termeles = 0; debug('planAttack', `nyers_termeles = NaN - ${farmCoord}`); }
			if (isNaN(nyers_VIJE)) { nyers_VIJE = 0; debug('planAttack', `nyers_VIJE = NaN - ${farmCoord}`); } 
			if (!(Number.isInteger(nyers_VIJE) && Number.isInteger(nyers_termeles))) debug('planAttack', `Nem is szám: nyers_VIJE=${nyers_VIJE} -- nyers_termeles=${nyers_termeles}`);
			let max_termeles = Math.ceil((SZEM4_FARM.DOMINFO_FARMS[farmCoord].prodHour / 60) * SZEM4_FARM.OPTIONS.megbizhatosag);
			nyers_termeles = Math.min(nyers_termeles, max_termeles);

			let isMax = nyers_termeles >= max_termeles * 0.95;
			let teher = nyers_VIJE + nyers_termeles;
			if (teher < hatarszam) {
				if (priority == 'heavy' || priority == 'light') {
					priority = 'sword';
					continue;
				}
				break;
			}

			// buildArmy - mivel getSlowestUnit kérés volt, így ebből az egységből biztos van, nem lehet 0
			let plannedArmy = buildArmy(SZEM4_FARM.DOMINFO_FROM[attacker], priority, teher, isMax);
			if (plannedArmy.units.pop == 0) break;
			if (!isMax && (plannedArmy.units.pop < minSereg || plannedArmy.teher < hatarszam)) {
				break;
			}
			bestSpeed = myTime;
			plan = {
				fromVill: attacker,
				farmVill: farmCoord,
				units: {...plannedArmy.units},
				travelTime: myTime,
				slowestUnit: priority,
				nyersToFarm: teher,
				debug_teher: plannedArmy.teher,
				debug_hatar: hatarszam,
				isMax: isMax
			};
			break;
		}
	}
	return plan;
	//	Megállapítani, mennyi nyersért kell menni , prió heavy > light > sword > spear
	//		Megnézi pl. heavy-vel, ha nem 0 van belőle: erre számol egyet.
	//			Ha a távolság > min(eddigi_legjobb_terv, bestSpeed): újratervezés kl-ekkel (csak heavy/sword esetén!) (!! bestSpeed=0 -> nincs még legjobb)
	//			Ha ez határszám alatti: újratervezés gyalogosokkal
	//			Ha max táv-on túl van: újratervezés light/march-al (csak heavy esetén!)
	//			Ha TERV során nem tudtunk elég egységet megfogni, újratervezés gyalogosokkal
	//	Ha a végén üres az eddigi_legjobb_terv, akkor return "NO_PLAN"; -> ugrás a következő farmra
}catch(e) {console.error(e); debug('planAttack', e);}}
function buildArmy(attacker, priorityType, teher, isMax) {try{
	let originalTeher = teher;
	const availableUnits = UNITS.reduce((obj, unit) => {
		obj[unit] = attacker.isUnits[unit] ? attacker.noOfUnits[unit] : 0;
		return obj;
	}, {});

	const unitToSend = { pop: 0 };
	let temp_plan = {};
	switch (priorityType) {
		// ----------- LOVASSÁG -------------
		case 'heavy':
			temp_plan = useUpUnit('heavy', teher);
			if (temp_plan.pop == 0)
				return {
					units: unitToSend,
					teher: originalTeher - teher
				};
			teher -= temp_plan.teher;
			unitToSend.heavy = temp_plan.unit;
			unitToSend.pop += temp_plan.pop;
			if (!(isMax && temp_plan.pop == 0) && teher < 40)	break;
		case 'light':
			temp_plan = useUpUnit('marcher', teher);
			if (temp_plan.pop !== 0) {
				teher -= temp_plan.teher;
				unitToSend.marcher = temp_plan.unit;
				unitToSend.pop += temp_plan.pop;
			}
			if (!(isMax && temp_plan.pop == 0) && teher < 40)	break;

			temp_plan = useUpUnit('light', teher);
			if (temp_plan.pop !== 0) {
				teher -= temp_plan.teher;
				unitToSend.light = temp_plan.unit;
				unitToSend.pop += temp_plan.pop;
			}
			break;
		// ----------- GYALOGOS -------------
		case 'sword':
			temp_plan = useUpUnit('sword', teher);
			if (temp_plan.pop == 0)
				return {
					units: unitToSend,
					teher: originalTeher - teher
				};
			teher -= temp_plan.teher;
			unitToSend.sword = temp_plan.unit;
			unitToSend.pop += temp_plan.pop;
			if (!(isMax && temp_plan.pop == 0) && teher < 40)	break;
		case 'spear':
			temp_plan = useUpUnit('spear', teher);
			if (temp_plan.pop !== 0) {
				teher -= temp_plan.teher;
				unitToSend.spear = temp_plan.unit;
				unitToSend.pop += temp_plan.pop;
			}
			if (!(isMax && temp_plan.pop == 0) && teher < 20)	break;

			temp_plan = useUpUnit('axe', teher);
			if (temp_plan.pop !== 0) {
				teher -= temp_plan.teher;
				unitToSend.axe = temp_plan.unit;
				unitToSend.pop += temp_plan.pop;
			}
			if (!(isMax && temp_plan.pop == 0) && teher < 20)	break;

			temp_plan = useUpUnit('archer', teher);
			if (temp_plan.pop !== 0) {
				teher -= temp_plan.teher;
				unitToSend.archer = temp_plan.unit;
				unitToSend.pop += temp_plan.pop;
			}
			break;
	}

	return {
		units: unitToSend,
		teher: originalTeher - teher
	};

	function useUpUnit(type, teher) {
		const usedUp = {
			pop: 0,
			unit: 0,
			teher: 0
		}
		if (availableUnits[type] == undefined || availableUnits[type] < 1) return usedUp;
		if (availableUnits[type] * TEHER[type] > teher) {
			usedUp.unit = Math.round(teher / TEHER[type]);
			if (isMax && usedUp.unit == 0) { usedUp.unit = 1; }
		} else {
			usedUp.unit = availableUnits[type];
		}
		usedUp.pop = usedUp.unit * TANYA[type];
		usedUp.teher = usedUp.unit * TEHER[type];
		return usedUp;
	}
}catch(e) {console.error(e); debug('buildArmy', e);}}
function extendArmy(oArmy, falukoord, slowestUnit) {try{
	/*  oArmy:
		units: {spear: 1, sword: 2, ..., pop: 3},
		teher: 322000
	 */
	switch(slowestUnit) {
		case 'heavy': tryAdd('heavy'); tryAdd('light'); tryAdd('marcher'); break;
		case 'light': tryAdd('light'); tryAdd('marcher'); break;
		case 'sword': tryAdd('sword'); tryAdd('axe'); tryAdd('spear'); tryAdd('archer'); break;
		case 'spear': tryAdd('axe'); tryAdd('spear'); tryAdd('archer'); break;
	}
	return oArmy;

	function tryAdd(unitType) {
		if (!SZEM4_FARM.DOMINFO_FROM[falukoord].isUnits[unitType]) return;
		if (!oArmy.units[unitType]) oArmy.units[unitType] = 0;
		while (oArmy.units.pop < SZEM4_FARM.OPTIONS.minsereg) {
			if (SZEM4_FARM.DOMINFO_FROM[falukoord].noOfUnits[unitType] < oArmy.units[unitType] + 1) {
				SZEM4_FARM.DOMINFO_FROM[falukoord].noOfUnits[unitType] = 0; //Hogy még 1x ne hozza fel, mert a minimumot se tudom elküldeni!
				break;
			}
			oArmy.units[unitType]++;
			oArmy.units.pop += TANYA[unitType];
			oArmy.teher += TEHER[unitType];
		}
	}
}catch(e){ console.error(e); debug('extendArmy', 'Error: '+e); return oArmy; }}

function getSlowestUnit(attacker) {try{
	// Get unit speed of the smallest available, but priorize horse
	// heavy > light,marcher > sword > spear,axe,archer
	const available_units = {};
	isUnit = false;
	for (let i=0;i<UNITS.length;i++) {
		if (UNITS[i] !== 'spy' && attacker.isUnits[UNITS[i]] && attacker.noOfUnits[UNITS[i]] > 0) {
			available_units[UNITS[i]] = true;
			isUnit = true;
		}
	}
	if (available_units.heavy) return 'heavy';
	if (available_units.light || available_units.marcher) return 'light';
	if (available_units.sword) return 'sword';
	if (isUnit) return 'spear';
	return '';
}catch(e) { debug('getSlowestUnit','Nem megállapítható egységsebesség, kl-t feltételezek ' + e); return E_SEB_ARR[5];}}
function updateAvailableUnits(attacker, isError=false) {try{
	for (let i=0;i<UNITS.length;i++) {
		let allUnit = parseInt(FARM_REF.document.getElementById(`units_entry_all_${UNITS[i]}`).textContent.match(/[0-9]+/g)[0],10);
		let unitToSendString = FARM_REF.document.getElementById(`unit_input_${UNITS[i]}`).value;
		if (unitToSendString == '') unitToSendString = 0;
		let unitToSend = isError ? 0 : parseInt(unitToSendString,10);
		attacker.noOfUnits[UNITS[i]] = allUnit - unitToSend;
	}
}catch(e) { console.error(e); debug('updateAvailableUnits', `Lépés: ${FARM_LEPES}, hiba: ${e}`);}}
function setNoUnits(attacker, unitType) {try{
	for (let i=0;i<UNITS.length;i++) {
		let unit = UNITS[i];
		if (unitType == 'troop' && (unit == 'spear' || unit == 'sword' || unit == 'axe' || unit == 'archer')) {
			attacker.noOfUnits[unit] = 0;
		}
		if (unitType == 'horse' && (unit == 'light' || unit == 'marcher' || unit == 'heavy')) {
			attacker.noOfUnits[unit] = 0;
		}
		if (unitType == 'all') {
			attacker.noOfUnits[unit] = 0;
		}
	}
}catch(e) { console.error(e); debug('setNoUnits', e);}}

function szem4_farmolo_1kereso(){try{/*Farm keresi párját :)*/
	// Nem pipálja a kémest az a baj
	var farmList = document.getElementById("farm_hova").rows;
	if (Object.keys(SZEM4_FARM.DOMINFO_FARMS) == 0 || Object.keys(SZEM4_FARM.DOMINFO_FROM) == 0) return "zero";
	var verszem = false;
	const targetIdo = SZEM4_FARM.OPTIONS.targetIdo;
	const maxWall = SZEM4_FARM.OPTIONS.maxfal;

	let bestPlan = { travelTime: -1 };
	for (var i=1;i<farmList.length;i++) {
		if (farmList[i].cells[0].style.backgroundColor=="red") continue;
		var farmCoord = farmList[i].cells[0].textContent;
		if (SZEM4_FARM.DOMINFO_FARMS[farmCoord].buildings.wall > maxWall) continue;
		let prodHour = SZEM4_FARM.DOMINFO_FARMS[farmCoord].prodHour;
		let hatarszam = prodHour * (targetIdo / 60);
		var nyers_VIJE = SZEM4_FARM.DOMINFO_FARMS[farmCoord].nyers;
		if (nyers_VIJE > 0) nyers_VIJE -= getAllResFromVIJE(farmCoord);
		verszem = false;
		if (nyers_VIJE > (hatarszam * 4)) verszem = true;
		
		/*Farm vizsgálat (a[i]. sor), legközelebbi saját falu keresés hozzá (van e egyátalán (par.length==3?))*/
		let attackPlan = planAttack(farmList[i], nyers_VIJE, verszem ? -1 : bestPlan.travelTime, hatarszam);
		
		if (attackPlan.travelTime && (bestPlan.travelTime == -1 || attackPlan.travelTime < bestPlan.travelTime)) {
			bestPlan = JSON.parse(JSON.stringify(attackPlan));
		}
		if (verszem && attackPlan.travelTime) {
			bestPlan = JSON.parse(JSON.stringify(attackPlan));
			break;
		}
	}
	return bestPlan;
}catch(e){debug('szem4_farmolo_1kereso()',e); return 'ERROR';}}

function szem4_farmolo_2illeszto(bestPlan){try{/*FIXME: határszám alapján számolódjon a min. sereg*/
	try{TamadUpdt(FARM_REF);}catch(e){}
	const allOptions = document.getElementById('farmolo_options');
	const minSereg = parseInt(allOptions.minsereg.value,10);
	const kemPerMin = parseInt(allOptions.kemperc.value,10);
	const kemdb = parseInt(allOptions.kemdb.value,10);
	const raktarLimit = parseInt(allOptions.raktar.value,10);
	const targetIdo = parseInt(allOptions.targetIdo.value,10);
	const hatarszam = SZEM4_FARM.DOMINFO_FARMS[bestPlan.farmVill].prodHour * (targetIdo / 60);
	const C_form = FARM_REF.document.forms["units"];
	
	// Kiiktatja ha van kiválasztott falu
	if (document.querySelector('#place_target .village-item')) document.querySelector('#place_target .village-item').click();

	if (!C_form) {
		if (FARM_REF.document.getElementById('command-data-form')) {
			C_form=FARM_REF.document.getElementById('command-data-form');
			debug('szem4_farmolo_2illeszto', 'ROllback-to-IDForm');
		} else {
			throw "Nincs gyülekezőhely?";
		}
	}
	if (C_form["input"].value == undefined) {
		throw "Nem töltött be az oldal? " + C_form["input"].innerHTML;
	}
	
	updateAvailableUnits(SZEM4_FARM.DOMINFO_FROM[bestPlan.fromVill]);
	//attackerRow, priorityType, teher
	const plannedArmy = buildArmy(SZEM4_FARM.DOMINFO_FROM[bestPlan.fromVill], bestPlan.slowestUnit, bestPlan.nyersToFarm);
	if (bestPlan.isMax && plannedArmy.units.pop < minSereg) {
		extendArmy(plannedArmy, bestPlan.fromVill, bestPlan.slowestUnit);
	}
	if (!plannedArmy.units || plannedArmy.units.pop < minSereg || (plannedArmy.teher + 50) < hatarszam) {
		if (bestPlan.isMax && plannedArmy.teher < hatarszam) {
			// Ha olyan messzi van a falu, amire a megbízhatóságnyi szintet is el tudná hozni, de olyan kevés ott a sereg, hogy az még a határszámnyi elhozásra se elég.
			for (let unitType in plannedArmy.units) {
				if (unitType === 'pop') continue;
				SZEM4_FARM.DOMINFO_FROM[bestPlan.fromVill].noOfUnits[unitType] = 0;
			}
		}
		console.info(new Date().toLocaleString(), `Invalid config, replanning. minSereg: ${minSereg}, isMax? ${bestPlan.isMax} hatarszam: ${hatarszam}, prodHour: ${SZEM4_FARM.DOMINFO_FARMS[bestPlan.farmVill].prodHour}`,
			`Config was: ${JSON.stringify(bestPlan)}`,
			`Config expected: ${JSON.stringify(plannedArmy)}`);
		return 'semmi'; // Nem jó, újratervezés
	}
	bestPlan.nyersToFarm = plannedArmy.teher;

	Object.entries(plannedArmy.units).forEach(entry => {
		const [unit, unitToSend] = entry;
		if (unit !== 'pop') {
			C_form[unit].value = unitToSend;
		}
	});

	// KÉMEK
	C_form.spy.value=0;
	let kemToSend = 0;
	if (SZEM4_FARM.DOMINFO_FROM[bestPlan.fromVill].isUnits.spy) {
		var ut_perc = distCalc(bestPlan.fromVill.split('|'), bestPlan.farmVill.split('|')) * E_SEB[bestPlan.slowestUnit] * (1/SPEED)*(1/UNIT_S);
		var erk = getServerTime();
		erk=erk.setSeconds(erk.getSeconds() + (ut_perc *60));
		
		if (!SZEM4_FARM.ALL_SPY_MOVEMENTS[bestPlan.farmVill] || (erk - SZEM4_FARM.ALL_SPY_MOVEMENTS[bestPlan.farmVill]) > (kemPerMin * 60000)) {
			let kemElerheto = FARM_REF.document.getElementById("unit_input_spy").parentNode.children[2].textContent.match(/[0-9]+/g)[0]
			kemElerheto = parseInt(kemElerheto, 10);
			kemToSend = (kemElerheto >= kemdb ? kemdb : 0)
			C_form.spy.value= kemToSend;
		}
	}

	/*Raktár túltelített?*/
	var nyersarany=((FARM_REF.game_data.village.wood+FARM_REF.game_data.village.stone+FARM_REF.game_data.village.iron) / 3) / FARM_REF.game_data.village.storage_max;
	if (Math.round(nyersarany*100)>parseInt(raktarLimit)) {
		setNoUnits(SZEM4_FARM.DOMINFO_FROM[bestPlan.fromVill], 'all');
		naplo('Farmoló', 'Raktár túltelített ebben a faluban: ' + bestPlan.fromVill + '. (' + Math.round(nyersarany*100) + '% > ' + raktarLimit + '%)');
		return "semmi";
	}

	C_form.x.value=bestPlan.farmVill.split("|")[0];
	C_form.y.value=bestPlan.farmVill.split("|")[1];
	
	updateAvailableUnits(SZEM4_FARM.DOMINFO_FROM[bestPlan.fromVill]);
	C_form.attack.click();

	bestPlan.units = JSON.parse(JSON.stringify(plannedArmy.units));
	return {
		plannedArmy: bestPlan,
		kem: kemToSend
	};
	//return [resultInfo.requiredNyers,ezt+'',adatok[2],adatok[3],slowestUnit,kek,resultInfo.debugzsak]; /*nyers_maradt;all/gyalog/semmi;honnan;hova;speed_slowest;kém ment e;teherbírás*/
}catch(e){debug("Illeszto()",e);FARM_LEPES=0;return "";}}

function szem4_farmolo_3egyeztet(adatok){try{
	var farm_helye=document.getElementById("farm_hova").rows;
	for (var i=1;i<farm_helye.length;i++) {
		if (farm_helye[i].cells[0].textContent==adatok.plannedArmy.farmVill) {farm_helye=farm_helye[i]; break;}
	}
	
	/*Piros szöveg*/
	try {
		if (FARM_REF.document.getElementById("content_value").getElementsByTagName("div")[0].getAttribute("class")=="error_box") {
			naplo("Farmoló", `Hiba ${adatok.plannedArmy.farmVill} farmolásánál: ${FARM_REF.document.getElementById("content_value").getElementsByTagName("div")[0].textContent}. Tovább nem támadom`);
			farm_helye.cells[0].style.backgroundColor="red";
			SZEM4_FARM.DOMINFO_FARMS[adatok.plannedArmy.farmVill].szin.falu = 'red';
			if (FARM_REF.document.querySelector('.village-item')) {
				FARM_REF.document.querySelector('.village-item').click();
			}
			updateAvailableUnits(SZEM4_FARM.DOMINFO_FROM[adatok.plannedArmy.fromVill], true);
			return "ERROR";
		}
	}catch(e){ console.error('szem4_farmolo_3egyeztet - piros szöveg', e); }
	
	/*Játékos-e?*/	
	try{
		if (FARM_REF.document.getElementById("content_value").getElementsByTagName("table")[0].rows[2].cells[1].getElementsByTagName("a")[0].href.indexOf("info_player")>-1) {
			if (!farm_helye.cells[4].getElementsByTagName("input")[0].checked) {
				naplo("Farmoló", `Játékos ${maplink(adatok.plannedArmy.farmVill)} helyen: ${FARM_REF.document.getElementById("content_value").getElementsByTagName("table")[0].rows[2].cells[1].innerHTML.replace("href",'target="_BLANK" href')}. Tovább nem támadom`);
				FARM_REF = windowOpener('farm', VILL1ST.replace("screen=overview","screen=place"), AZON+"_Farmolo"); // Ki kell ütni a nézetből
				farm_helye.cells[0].style.backgroundColor="red";
				updateAvailableUnits(SZEM4_FARM.DOMINFO_FROM[adatok.plannedArmy.fromVill], true);
				return "ERROR";
			}
		}
	}catch(e){ /* Nem az... */ }

	/* TravelTime egyezik? */
	let timeFormatted = FARM_REF.document.querySelector('#content_value .vis').rows[2].cells[1].textContent;
	let writedTime = timeFormatted.split(':').map((a) => parseInt(a, 10));
	writedTime = writedTime[0] * 60 + writedTime[1] + (writedTime[2] / 60);
	if (Math.abs(writedTime - adatok.plannedArmy.travelTime) > 0.05) {
		debug('szem4_farmolo_3egyeztet', `A tervezett idő (${adatok.plannedArmy.travelTime} perc) nem egyezik a küldendő idővel: ${timeFormatted}.`);
		return "ERROR";
	}

	/* Teherbírás egyezik? */
	// try{
	// 	var a = FARM_REF.document.getElementById("content_value").getElementsByTagName("table")[0].rows;
	// 	a = parseInt(a[a.length-1].cells[0].textContent.replace(/[^0-9]+/g,""));
	// 	if (adatok.plannedArmy.nyersToFarm != a) debug("farm3","Valódi teherbírás nem egyezik a kiszámolttal. Hiba, ha nincs teherbírást módosító \"eszköz\".");
	// }catch(e){ console.error('szem4_farmolo_3egyeztet - teherbiras',e) }

	/* KÉK háttér bányára? */
	if (adatok.kem > 0 && farm_helye.cells[1].textContent == '') {
		const scoutColor = 'rgb(213, 188, 244)';
		farm_helye.cells[1].style.backgroundColor = scoutColor;
		SZEM4_FARM.DOMINFO_FARMS[adatok.plannedArmy.farmVill].szin.banya = scoutColor;
	}

	addCurrentMovementToList(FARM_REF.document.getElementById('command-data-form'), adatok.plannedArmy.farmVill, farm_helye);
	FARM_REF.document.getElementById("troop_confirm_submit").click();
	document.getElementById('cnc_farm_heartbeat').innerHTML = new Date().toLocaleString();
	const megbizhatosag = parseInt(document.getElementById('farmolo_options').megbizhatosag.value, 10);
	const prodHour = SZEM4_FARM.DOMINFO_FARMS[adatok.plannedArmy.farmVill].prodHour;
	if (adatok.plannedArmy.nyersToFarm > (prodHour * (megbizhatosag / 60) * 3)) {
		playSound(`farmolas_exp`, 'mp3');
	} else {
		playSound(`farmolas_${Math.floor(1 + Math.random() * (11 - 1 + 1))}`, 'mp3');
	}
	// return [nez,sarga,adatok[2],adatok[3]];
	/*Legyen e 3. lépés;sárga hátteres idő lesz?;honnan;---*/
}catch(e){debug("szem4_farmolo_3egyeztet()",e); FARM_LEPES=0;}}

function szem4_farmolo_4visszaell(adatok){try{
	/*
		true,sarga?,honnan,hova
		vagy
		nyers_maradt(db);all/gyalog + semmi;honnan;hova;speed_slowest
	*/
	var falu_helye=document.getElementById("farm_honnan").rows;
	for (var i=1;i<falu_helye.length;i++) {
		if (falu_helye[i].cells[0].textContent==adatok[2]) {falu_helye=falu_helye[i]; break;}
	}
	updateAvailableUnits(SZEM4_FARM.DOMINFO_FROM[adatok[2]], true);
	
	if (typeof adatok[1]=="boolean") var lehetEGyalog=adatok[1]; else {
		if (adatok[1].indexOf("all")>-1) var lehetEGyalog=true; else var lehetEGyalog=false;
	}

	if (lehetEGyalog) { /*Sárga; de ha nincs gyalog->fehér*/
		var backtest=false;
		for (var i=0;i<3;i++) {
			if (falu_helye.cells[1].getElementsByTagName("input")[i].checked) {
				if (FARM_REF.document.getElementById("unit_input_"+UNITS[i])) {
					if (parseInt(FARM_REF.document.getElementById("unit_input_"+UNITS[i]).parentNode.children[2].textContent.match(/[0-9]+/g)[0])>5) {
						backtest=true;
						break;
					}
				}
			}
		}
		if (!backtest) lehetEGyalog=false;
	} /*ellenben nézd meg van e bent ló amit lehet küldeni!?*/
	
	/*Leggyorsabb kijelölt egység*/
	var a=falu_helye.cells[1].getElementsByTagName("input");
	var fastest=22;
	for (var i=0;i<a.length;i++) {
		if (i==4) continue;
		if (a[i].checked && E_SEB_ARR[i]<fastest) fastest=E_SEB_ARR[i];
	}
	fastest = fastest*(1/SPEED)*(1/UNIT_S);
	
}catch(e){debug("szem4_farmolo_4visszaell()",e); return;}}

function szem4_farmolo_motor(){
	var nexttime = 500;
	var isPihen = false;
	try {
	nexttime = parseInt(document.getElementById("farmolo_options").sebesseg_m.value,10);

	if (BOT||FARM_PAUSE||USER_ACTIVITY) { nexttime = 5000; }
	else if (NORBI0N_FARM_LEPES !== 0) { nexttime = 3000; } // Wait for Norbi0N_Farm
	else {
	/*if (FARM_REF!="undefined" && FARM_REF.closed) FARM_LEPES=0;*/
	if (FARM_HIBA>10) {
		FARM_HIBA=0; FARM_GHIBA++; FARM_LEPES=0;
		if(FARM_GHIBA>3) {
			if (FARM_GHIBA>5) {
				naplo("Globál","Nincs internet? Folyamatos hiba farmolónál");
				nexttime = 60000;
				playSound("bot2");
			}
			FARM_REF.close();
		}
	}
	switch (FARM_LEPES) {
		case 0: /*Meg kell nézni mi lesz a célpont, +nyitni a HONNAN-t.*/
				PM1=szem4_farmolo_1kereso();
				if (PM1=="zero" || PM1=="ERROR") {nexttime=10000; break;} /* Ha nincs még tábla feltöltve */
				if (PM1.travelTime == -1) { // Nincs munka
						nexttime=parseInt(document.getElementById("farmolo_options").sebesseg_p.value,10);
						nexttime*=60000;
						isPihen = true;
						sendCustomEvent('farm_pihen');
						// Reset round
						for (let aUnit in SZEM4_FARM.DOMINFO_FROM) {
							Object.keys(SZEM4_FARM.DOMINFO_FROM[aUnit].noOfUnits).reduce((item, key) => {
								item[key] = 999;
								return item;
							}, SZEM4_FARM.DOMINFO_FROM[aUnit].noOfUnits);
						}

						try {
							if (MOBILE_MODE)
								FARM_REF.close();
							else
								FARM_REF.document.title = 'Szem4/farmoló';
						} catch(e) {}
						break;
				}
				if (!isPageLoaded(FARM_REF, KTID[PM1.fromVill],"screen=place") ||
					FARM_REF.document.location.href.indexOf("try=confirm") > -1 ||
					(FARM_REF.document.location.href.includes("mode=") && !FARM_REF.document.location.href.includes('mode=command'))) {
						FARM_REF=windowOpener('farm', VILL1ST.replace(/village=[0-9]+/,"village="+KTID[PM1.fromVill]).replace("screen=overview","screen=place"), AZON+"_Farmolo");
				}
				/*debug("Farmoló_ToStep1",PM1);*/
				FARM_LEPES=1;
				break;
		case 1: /*Gyül.helyen vagyunk, be kell illeszteni a megfelelő sereget, -nyers.*/
				if (isPageLoaded(FARM_REF,KTID[PM1.fromVill],"screen=place")) {
					FARM_REF.document.title = 'Szem4/farmoló';
					PM1=szem4_farmolo_2illeszto(PM1);
					FARM_HIBA=0; FARM_GHIBA=0;
					if (PM1 === 'semmi') 
						FARM_LEPES = 0;
					else
						FARM_LEPES = 2;
				} else {FARM_HIBA++;}
				break;
		case 2: /*Confirm: nem e jött piros szöveg, játékos e -> OK-ézás.*/ 
				if (!PM1.plannedArmy || !PM1.plannedArmy.fromVill) {
					FARM_LEPES = 0;
					debug('szem4_farmolo_motor', 'Érvénytelen állapot' + (typeof PM1 === 'object' ? JSON.parse(PM1) : PM1));
					break;
				}
				if (isPageLoaded(FARM_REF,KTID[PM1.plannedArmy.fromVill],"try=confirm")) {
					FARM_HIBA=0; FARM_GHIBA=0;
					PM1=szem4_farmolo_3egyeztet(PM1);
					if (PM1 === 'ERROR') FARM_LEPES = 0;
					// if (typeof(PM1)=="object" && PM1.length>0 && PM1[0]==true) { FARM_LEPES=3; } else FARM_LEPES=0;
					FARM_LEPES = 0;
				} else {FARM_HIBA++;}
				break;
		case 3: /* SOSEM KELL? Jelenleg nem megyek ide */
				/*Támadás elküldve, időt és ID-t nézünk, ha kell.*/ 
				/*Kell e időt nézni? Kell, ha PM1[1].indexOf("semmi")>-1 VAGY PM1[0]=TRUE; */
				if (isPageLoaded(FARM_REF,KTID[PM1[2]],"not try=confirm")) {FARM_HIBA=0; FARM_GHIBA=0;
					szem4_farmolo_4visszaell(PM1);
					FARM_LEPES=0;
				} else {FARM_HIBA++;}
				break;
		default: FARM_LEPES=0;
	}}
}catch(e){debug("szem4_farmolo_motor()",e+" Lépés:"+FARM_LEPES);}

var inga=100/((Math.random()*40)+80);
nexttime=Math.round(nexttime*inga);
if (isPihen) {
	debug('Farmoló', `Farmoló pihenni megy ${Math.round(nexttime / 60000)} percre`);
}
try{
	worker.postMessage({'id': 'farm', 'time': nexttime});
}catch(e){debug('farm', 'Worker engine error: ' + e);setTimeout(function(){szem4_farmolo_motor();}, 3000);}}

init();
ujkieg_hang("Alaphangok","naplobejegyzes;bot2;farmolas");
ujkieg("farm","Farmoló",`<tr><td>
	<table class="vis" id="farm_opts" style="width:100%; margin-bottom: 50px;">
		<tr>
			<th colspan="2">Beállítások</th>
		</tr>
		<tr>
			<td colspan="2" style="text-align: center">
			<form id="farmolo_options">
			<table>
			<tr><td><div class="combo-cell"><div class="imgbox"><img src="${pic('mozdony.png')}"></div><strong>Szerelvények</strong></div></td>
			<td>
			Menetrend: <input name="targetIdo" value="30" onkeypress="validate(event)" type="text" size="2" onmouseover="sugo(this, 'SZEM arra fog törekedni, hogy minimum ennyi időközönként indítson támadást egy falura')">p - 
			<input name="megbizhatosag" value="60" onkeypress="validate(event)" type="text" size="2" onmouseover="sugo(this, 'Megbízhatóság. MAX ennyi ideig létrejött termelésért indul (plusz felderített nyers)')">p
			Max táv: <input name="maxtav_ora" type="text" size="2" value="4" onkeypress="validate(event)" onmouseover="sugo(this,'A max távolság, amin túl már nem küldök támadásokat')">óra <input name="maxtav_p" onkeypress="validate(event)" type="text" size="2" value="0" onmouseover="sugo(this,'A max távolság, amin túl már nem küldök támadásokat')">perc.
			</td></tr>

			<tr>
			<td><div class="combo-cell"><div class="imgbox">${picBuilding('wall')}</div><strong>Fal szint</strong></div></td>
			<td>Ha a fal &gt; <input type="text" size="3" name="maxfal" onkeypress="validate(event)" value="3" onmouseover="sugo(this,'Élesen nagyobb! 0 esetén a fallal rendelkezőeket nem támadja.')">, nem támadja</td>
			</tr>

			<tr><td><div class="combo-cell"><div class="imgbox"><img src="${pic('beallitasok.png')}"></div><strong>Alapértékek</strong></div></td>
			<td>
			Termelés/óra: <input name="termeles" onkeypress="validate(event)" type="text" size="5" value="800" onchange="updateDefaultProdHour()" onmouseover="sugo(this,'Ha nincs felderített bányaszint, úgy veszi ennyi nyers termelődik ott óránként')">				
			Min sereg/falu: <input name="minsereg" onkeypress="validate(event)" type="text" value="20" size="4" onmouseover="sugo(this,'Ennél kevesebb fő támadásonként nem indul. A szám tanyahely szerinti foglalásban értendő. Javasolt: Határszám 1/20-ad része')">
			Ha a raktár &gt;<input name="raktar" onkeypress="validate(event)" type="text" size="2" onmouseover="sugo(this,'Figyeli a raktár telítettségét, és ha a megadott % fölé emelkedik, nem indít támadást onnan. Telítettség össznyersanyag alapján számolva. Min: 20. Ne nézze: 100-nál több érték megadása esetén.')" value="90">%, nem foszt.
			</td></tr>

			<tr><td><div class="combo-cell"><div class="imgbox"><img src="/graphic/unit/unit_spy.png"></div><strong>Kémek</strong></div></td>
			<td>
			Kém/falu: <input name="kemdb" onkeypress="validate(event)" type="text" value="1" size="2" onmouseover="sugo(this,'A kémes támadásokkal ennyi kém fog menni')">
			Kényszerített? <input name="isforced" type="checkbox" onmouseover="sugo(this,'Kémek nélkül nem indít támadást, ha kéne küldenie az időlimit esetén. Kémeket annak ellenére is fog vinni, ha nincs bepipálva a kém egység')">
			Kém/perc: <input name="kemperc" type="text" value="60" onkeypress="validate(event)" size="3" onmouseover="sugo(this,'Max ekkora időközönként küld kémet falunként')">
			</td></tr>
			
			<tr><td><div class="combo-cell"><div class="imgbox"><img src="${pic('sebesseg.png')}"></div><strong>Sebesség</strong></div></td>
			<td>
			<input name="sebesseg_p" onkeypress="validate(event)" type="text" size="2" value="10" onmouseover="sugo(this,'Ha a farmoló nem talál több feladatot magának megáll, ennyi időre. Érték lehet: 1-300. Javasolt érték: 15 perc')">perc /
						<input name="sebesseg_m" onkeypress="validate(event)" type="text" size="3" value="900" onmouseover="sugo(this,'Egyes utasítások/lapbetöltődések ennyi időközönként hajtódnak végre. Érték lehet: 200-6000. Javasolt: gépi: 500ms, emberi: 3000.')">ms.
			</td></tr></table>
			</form>
			</td>
		</tr>
		<tr>
			<th>Farmoló falu hozzáadása</th>
			<th>Farmolandó falu hozzáadása</th>
		</tr><tr>
			<td style="width:48%;" onmouseover="sugo(this,'Adj meg koordinátákat, melyek a te faluid és farmolni szeretnél velük. A koordináták elválasztása bármivel történhet.')">
				Koordináták: <input type="text" size="45" id="add_farmolo_faluk" placeholder="111|111, 222|222, ...">
				<input type="button" value="Hozzáad" onclick="add_farmolo()">
			</td>
			<td style="width:52%;" onmouseover="sugo(this,'Adj meg koordinátákat, amelyek farmok, és farmolni szeretnéd. A koordináták elválasztása bármivel történhet.')">
				Koordináták: <input type="text" size="45" id="add_farmolando_faluk" placeholder="111|111, 222|222, ...">
				<input type="button" value="Hozzáad" onclick="add_farmolando()">
			</td>
		</tr><tr>
			<td onmouseover="sugo(this,'A felvivendő falukból ezeket az egységeket használhatja SZEM IV farmolás céljából. Később módosítható.')" id="add_farmolo_egysegek" style="vertical-align:middle;">
				Mivel? ${rovidit("egysegek")}
			</td>
			<td>
			</td>
		</tr><tr>
			<td colspan="2" class="nopadding_td" onmouseover="sugo(this, 'Farmoló által küldött utolsó támadás idejét látod itt. Ha a szívre kattintasz, újraéleszted/feléleszted a farmolót a pihenésből.')">
				<div class="heartbeat_wrapper">
					<img src="${pic("heart.png")}" class="heartbeat_icon" onclick="restartKieg('farm')">
					<span id="cnc_farm_heartbeat">---</span>
				</div>
			</td>
		</tr>
	</table>
	<div class="szem4_farmolo_datatable_wrapper">
		<table class="vis" id="farm_honnan" style="vertical-align:top; display: inline-block;"><tr>
			<th width="55px" onmouseover="sugo(this,'Ezen falukból farmolsz. Dupla klikk az érintett sor koordinátájára=sor törlése.<br>Rendezhető')" style="cursor: pointer;" onclick='rendez("szoveg",false,this,"farm_honnan",0)'>Honnan</th>
			<th onmouseover="sugo(this,'Ezen egységeket használja fel SZEM a farmoláshoz. Bármikor módosítható. <br>Pipa: egy cellán végrehajtott (duplaklikkes) művelet minden látható falura érvényes lesz.')" style="position: relative; height: 20px; min-width: 100px">
				Mivel?
				<span style="position:absolute;right: 7px;top: 3px;display: flex;vertical-align: middle;align-items: center;">
					<img src="${pic("search.png")}" alt="?" title="Szűrés falukra..." style="width:15px;height:15px; cursor: pointer;" onclick="szem4_farmolo_csoport('honnan')">
					<input type="checkbox" id="farm_multi_honnan" onmouseover="sugo(this,'Ha bepipálod, akkor egy cellán végzett dupla klikkes művelet minden sorra érvényes lesz az adott oszlopba (tehát minden falura), ami jelenleg látszik. Légy óvatos!')">
				</span>
			</th>
		</tr></table>\
		<table class="vis" id="farm_hova" style="vertical-align:top; display: inline-block;"><tr>
			<th onmouseover="sugo(this,'Ezen falukat farmolod. A háttérszín jelöli a jelentés színét: alapértelmezett=zöld jelik/nincs felderítve. Sárga=veszteség volt a falun. Piros: a támadás besült, nem megy rá több támadás.<br>Dupla klikk a koordira: a háttérszín alapértelmezettre állítása.<br>Rendezhető')" style="cursor: pointer;" onclick='rendez("szoveg",false,this,"farm_hova",0)'>Hova</th>
			<th onmouseover="sugo(this,'Felderített bányaszintek, ha van. Kék háttér: megy rá kémtámadás.<br>Dupla klikk=az érintett sor törlése')">Bányák</th>
			<th onmouseover="sugo(this,'Fal szintje. Szimpla klikk: Katapultozó scriptet megtanítja az adott falu épületszintjeire. Dupla klikk=háttér csere (csak megjelölésként). 2 féle lehet: a zöld háttér a falszint változására eltűnik, a kék keret viszont csak manuálisan törölhető.<br>Rendezhető.')" onclick='rendez("szam",false,this,"farm_hova",2)' style="cursor: pointer;">Fal</th>
			<th onmouseover="sugo(this,'Számítások szerint ennyi nyers van az érintett faluba. Dupla klikk=érték módosítása.<br>Rendezhető.')" onclick='rendez("szam",false,this,"farm_hova",3)' style="cursor: pointer;">Nyers</th>
			<th onmouseover="sugo(this,'Játékos e? Ha játékost szeretnél támadni, pipáld be a falut mint játékos uralta, így támadni fogja. Ellenben piros hátteret kap a falu. (WIP: Nem működik/nem ismer fake-limitet, csupán engedi támadni!)')">J?</th>
			<th onmouseover="sugo(this,'Támadásokat tudod itt nyomon követni szerelvények formájában, melyek a támadási algoritmus alapjait képzik<br><br>Pipa: egy cellán végrehajtott (duplaklikkes) művelet minden látható falura érvényes lesz.')" style="height: 20px; vertical-align:middle;">
				Szerelvények
				<span style="position:absolute;right: 7px;top: 3px;display: flex;vertical-align: middle;align-items: center;">
					<img src="${pic("search.png")}" alt="?" title="Szűrés falukra..." style="width:15px;height:15px;" onclick="szem4_farmolo_csoport('hova')">
					<input type="checkbox" id="farm_multi_hova">
				</span>
			</th>
		</tr></table>
</div></p></td></tr>`);

var FARM_LEPES=0, FARM_REF, FARM_HIBA=0, FARM_GHIBA=0,
	BOT=false,
	FARMOLO_TIMER,
	SZEM4_FARM = {
		ALL_UNIT_MOVEMENT: {}, //{..., hova(koord): [[ mennyi_termelésből(teherbírás), mikorra(getTime()), mennyi_VIJE_miatt(teherbírás) ], ...], ...}
		ALL_SPY_MOVEMENTS: {}, // hova(koord): mikor ment utoljára kém
		DOMINFO_FARMS: {}, // village: {prodHour: <number>, buildings: {main: <number>, barracks: <number>, wall: <number>}, nyers: <number>, isJatekos: <boolean> }
		DOMINFO_FROM: {}, // village: {isUnits: {spear: true, sword: false, ...}, noOfUnits: {spear: 999, sword: 0, ...}}
		OPTIONS: {}
	},
	PM1, FARM_PAUSE=true;
szem4_farmolo_motor();

/* --------------------- JELENTÉS ELEMZŐ ----------------------- */
function readUpVijeOpts() {
	document.querySelectorAll('#vije_opts input').forEach(el => {
		if (el.type == 'text') {
			SZEM4_VIJE.i18ns[el.name] = el.value;
		} else if (el.type == 'checkbox') {
			SZEM4_VIJE.i18ns[el.name] = el.checked;
		}
	});
}
function rebuildDOM_VIJE() {
	document.querySelectorAll('#vije_opts input').forEach(el => {
		if (SZEM4_VIJE.i18ns[el.name] == undefined) return;
		if (el.type == 'text') {
			el.value = SZEM4_VIJE.i18ns[el.name];
		} else if (el.type == 'checkbox') {
			el.checked = SZEM4_VIJE.i18ns[el.name];
		}
	});
}
function VIJE_IntelliAnalyst_isRequired(koord, jelRow, jelDate) {
	jelDate.setSeconds(59);
	if (SZEM4_VIJE.ALL_VIJE_SAVED[koord] && SZEM4_VIJE.ALL_VIJE_SAVED[koord] > jelDate) return false;
	
	const isSpy = !!jelRow.querySelector('img[src*="spy"]');
	if (isSpy) return true;

	let nyers_VIJE = SZEM4_FARM.DOMINFO_FARMS[koord].nyers;
	if (nyers_VIJE > 0) nyers_VIJE -= getAllResFromVIJE(koord);
	if (nyers_VIJE > 100) return true;
	return false;
}
function szem4_vije_forgot() {
	SZEM4_VIJE.ELEMZETT = [];
	SZEM4_VIJE.ALL_VIJE_SAVED = {};
	alert2('Elemzett jelentések elfelejtve')
}
function szem4_VIJE_1kivalaszt(){try{
	/*Eredménye: jelentés azon (0=nincs meló);farm koord;jelentés SZÍNe;volt e checkbox-olt jeli*/
	try{TamadUpdt(VIJE_REF1);}catch(e){}
	VT=VIJE_REF1.document.getElementById("report_list").rows;
	if (VT.length<3) return [0,0,"",false];
	var isAnalize=false;
	let szin = '';
	for (var i=VT.length-2;i>0;i--) {
		// Relic mode: új HTML struktúra - span.quickedit[data-id] vagy span.report-title[data-id]
		// Régi mód: span[data-id="label_XXX"]
		var reportIdSpan = VT[i].cells[1].querySelector('span.quickedit[data-id], span.report-title[data-id]')
			|| VT[i].cells[1].getElementsByTagName("span")[0];
		var reportId = reportIdSpan.getAttribute("data-id").replace("label_","");
		if (SZEM4_VIJE.ELEMZETT.includes(reportId)) continue;

		try {
			var koord = VT[i].cells[1].textContent.match(/[0-9]+(\|)[0-9]+/g);
			koord = koord[koord.length-1];
		} catch(e) { continue; }
		var eredm = VIJE_FarmElem(koord); /*0:létező farm-e,1:van-e már bánya derítve,2:farm_helye DOM row element*/
		if (eredm[0]==false) continue;

		/*+++IDŐ*/
		var d=getServerTime(VIJE_REF1); var d2=getServerTime(VIJE_REF1);
		(function convertDate() {
			var ido = VT[i].cells[2].textContent;
			var oraperc=ido.match(/[0-9]+:[0-9]+/g)[0];
			var nap=ido.replace(oraperc,"").match(/[0-9]+/g)[0];
			d.setMinutes(parseInt(oraperc.split(":")[1],10));
			d.setHours(parseInt(oraperc.split(":")[0],10));
			d.setDate(parseInt(nap,10));
		})();

		/* Régi jelentés? */
		if ((d2-d) > 10800000 || (d2-d) < 0) var regi=true; else var regi=false; /*3 óra*/
		if (regi) continue;

		/* Szín lekezelése */
		const farm_helye = eredm[2];
		szin = VT[i].cells[1].childNodes;
		for (var s=0;s<szin.length;s++) {
			if (szin[s].nodeName=="IMG") {
				// Támogatja mind .png és .webp formátumot (új szerverek webp-t használnak)
				var imgSrc = szin[s].src;
				if (imgSrc.includes('.webp')) {
					szin = imgSrc.split(".webp")[0].split("/");
				} else {
					szin = imgSrc.split(".png")[0].split("/");
				}
				szin=szin[szin.length-1];
				break;
			}
		}

		if (szin.includes("green")) {
			VT[i].cells[0].getElementsByTagName("input")[0].checked = true;
			farm_helye.cells[0].style.backgroundColor="#f4e4bc";
		}
		else if (szin.includes('yellow')) {
			farm_helye.cells[0].style.backgroundColor = 'yellow';
			SZEM4_FARM.DOMINFO_FARMS[koord].szin.falu = 'yellow';
		}
		else if (!szin.includes('blue') && farm_helye.cells[0].style.backgroundColor !== 'red') {
			farm_helye.cells[0].style.backgroundColor = 'red';
			SZEM4_FARM.DOMINFO_FARMS[koord].szin.falu = 'red';
			naplo('Jelentés Elemző', `${koord} farm veszélyesnek ítélve. Jelentésének színe ${szin}.`);
		}

		/* Van értelme elemezni? */
		if (!VIJE_IntelliAnalyst_isRequired(koord, VT[i].cells[1], d)) {
			SZEM4_VIJE.ELEMZETT.push(reportId);
			continue;
		} else {
			isAnalize=true;
			break;
		}
	}
	/*Ha nincs talált jeli --> nézd meg volt e checkboxolt, és ha igen, akkor törlés, majd pihenés */
	if (!isAnalize) {
		for (var i=VT.length-2;i>0;i--) {
			if (VT[i].cells[0].getElementsByTagName("input")[0].checked) {
				szem4_VIJE_3torol();
				return [0,0,"",true];
			}
		}
		return [0,0,"",false];
	}
	
	// reportId, farm koord, jelentés színe, ???, régi
	return [reportId,koord,szin,false,regi];

	function VIJE_FarmElem(koord){try{
		var farm_helye=document.getElementById("farm_hova").rows;
		var isExists=false;
		for (var i=1;i<farm_helye.length;i++) {
			if (farm_helye[i].cells[0].textContent==koord) {
				isExists=true;
				farm_helye=farm_helye[i];
				break;
			}
		}
		if (!isExists) return [false,false,0];
		
		var banyaVanE=true;
		if (farm_helye.cells[1].textContent=="") banyaVanE=false;
		
		return [isExists, banyaVanE, farm_helye, true];
	}catch(e){debug("VIJE1_farmelem","Hiba: "+e);}}
}catch(e){debug("VIJE1","Hiba: "+e);return [0,0,"",false];}}

function VIJE_adatbeir(koord,nyers,banya,fal,szin, hungarianDate){try{
	// célpont, 0, '', '', szín, jelidate
	var farm_helye=document.getElementById("farm_hova").rows;
	for (var i=1;i<farm_helye.length;i++) {
		if (farm_helye[i].cells[0].textContent==koord) {farm_helye=farm_helye[i]; break;}
	}
	if (banya!=='') {
		farm_helye.cells[1].innerHTML=banya;
		SZEM4_FARM.DOMINFO_FARMS[koord].prodHour = getProdHour(banya.join(','));
		farm_helye.cells[1].style.backgroundColor = '';
		SZEM4_FARM.DOMINFO_FARMS[koord].szin.banya = '';
	}
	if (szin == 'SEREG') {
		farm_helye.cells[0].style.backgroundColor = 'red';
		SZEM4_FARM.DOMINFO_FARMS[koord].szin = SZEM4_FARM.DOMINFO_FARMS[koord].szin || {};
		SZEM4_FARM.DOMINFO_FARMS[koord].szin.falu = 'red';
		naplo('VIJE', `${koord} -- Sereg a faluban!`);
	}
	if (fal !== '') {
		if (parseInt(farm_helye.cells[2].textContent.trim(), 10) !== parseInt(fal, 10)) {
			farm_helye.cells[2].style.backgroundColor = '';
			SZEM4_FARM.DOMINFO_FARMS[koord].szin.fal = '';
		}
		farm_helye.cells[2].innerHTML = `
		<span class="tooltip_hover">
			${fal}
			<span class="tooltip_text"></span>
		</span>`;
		SZEM4_FARM.DOMINFO_FARMS[koord].buildings.wall = fal;
	}
	if (nyers !== '') { // Ha van adatunk a nyersanyagról...
		farm_helye.cells[3].innerHTML = nyers;
		SZEM4_FARM.DOMINFO_FARMS[koord].nyers = nyers;
		if (!SZEM4_VIJE.ALL_VIJE_SAVED[koord] || SZEM4_VIJE.ALL_VIJE_SAVED[koord] < hungarianDate)
			SZEM4_VIJE.ALL_VIJE_SAVED[koord] = hungarianDate;
	}
	// Mockolt támadás beillesztése ha nem regisztrált támadásról jött jelentés
	var allAttack = SZEM4_FARM.ALL_UNIT_MOVEMENT[koord];
	if (!allAttack) SZEM4_FARM.ALL_UNIT_MOVEMENT[koord] = [[10000, hungarianDate, 0]];
	else {
		// debug('VIJE_adatbeir', `+Mock add: ${JSON.stringify(allAttack)} --`);
		var smallestDifference = null;
		SZEM4_FARM.ALL_UNIT_MOVEMENT[koord].forEach(arr => {
			var difference = Math.abs(arr[1] - hungarianDate);
			if (!smallestDifference || difference < smallestDifference) {
				smallestDifference = difference;
			}
		});
		if (smallestDifference > 60000) SZEM4_FARM.ALL_UNIT_MOVEMENT[koord].push([10000, hungarianDate, 0]); // FIXME: Ne 10k legyen már hanem MAX_megbízhatóság
		// debug('VIJE_adatbeir', `Mock added: ${JSON.stringify(allAttack)}`);
	}
	drawWagons(koord);
}catch(e){debug("VIJE_adatbeir","Hiba: "+e);}}
function szem4_VIJE_2elemzes(adatok){try{
	/*Adatok: [0]jelentés azon;[1]célpont koord;[2]jelentés SZÍNe;[3]volt e checkbox-olt jeli;[4]régi jeli e? (igen->nincs nyerselem)*/
	var nyersossz=0;
	var isOld = false;
	var reportTable=VIJE_REF2.document.getElementById("attack_info_att").parentNode;
	while (reportTable.nodeName != 'TABLE') {
		reportTable = reportTable.parentNode;
	}
	var hungarianDate = reportTable.rows[1].cells[1].innerText;
	var defUnits = VIJE_REF2.document.getElementById('attack_info_def_units');
	if (defUnits && defUnits.textContent.match(/[1-9]+/g)) adatok[2] = 'SEREG';
	hungarianDate = new Date(Date.parse(hungarianDate.replace(/jan\./g, "Jan").replace(/febr?\./g, "Feb").replace(/márc\./g, "Mar").replace(/ápr\./g, "Apr").replace(/máj\./g, "May").replace(/jún\./g, "Jun").replace(/júl\./g, "Jul").replace(/aug\./g, "Aug").replace(/szept\./g, "Sep").replace(/okt\./g, "Oct").replace(/nov\./g, "Nov").replace(/dec\./g, "Dec")));
	hungarianDate = hungarianDate.getTime();
	if (SZEM4_VIJE.ALL_VIJE_SAVED[adatok[1]] >= hungarianDate) isOld = true;
	if (!isOld && VIJE_REF2.document.querySelector('#attack_spy_resources') !== null) {
		// Relic mode: az első sor a Relikvia, a második a nyersanyagok
		// Régi mód: az első sor a nyersanyagok
		var spyResourcesTable = VIJE_REF2.document.getElementById("attack_spy_resources");
		var isRelicMode = document.getElementById("vije_opts").isRelicMode.checked;
		var resourceRowIndex = 0;

		// Relic módban vagy ha az első sor "Relikvia" szót tartalmaz, a második sort használjuk
		if (isRelicMode || (spyResourcesTable.rows[0] && spyResourcesTable.rows[0].textContent.includes('Relikvia'))) {
			resourceRowIndex = 1;
		}

		// Ellenőrizzük, hogy létezik-e a sor és nincs-e benne link (ami arra utal, hogy nem teljes a felderítés)
		var resourceRow = spyResourcesTable.rows[resourceRowIndex];
		if (!resourceRow || (resourceRow.cells[1] && resourceRow.cells[1].querySelector('a') != null)) {
			// Nincs megfelelő sor vagy nem teljes felderítés - skipeljük a nyersanyag elemzést
			var x = null;
		} else {
			var x = resourceRow.cells[1];
		}

		if (adatok[4]) { var nyersossz=''; debug("VIJE2","Nem kell elemezni (régi)"); } else if (x) {
			try{
				if (/\d/.test(x.textContent)) {
					var nyers=x.textContent.replace(/\./g,"").match(/[0-9]+/g);
					var nyersossz=0;
					for (var i=0;i<nyers.length;i++) nyersossz+=parseInt(nyers[i],10);
				} else {
					nyersossz=0;
				}
			}catch(e){var nyersossz=0; debug("VIJE","<a href='"+VIJE_REF2.document.location+"' target='_BLANK'>"+adatok[0]+"</a> ID-jű jelentés nem szokványos, talált nyers 0-ra állítva. Hiba: "+e);}
		}
	
		// Épületek
		if (VIJE_REF2.document.getElementById("attack_spy_buildings_left")) {
			var i18nBuildings=document.getElementById("vije_opts");
			const spyLevels = {
				main: 1,
				barracks: 0,
				stable: 0,
				garage: 0,
				smith: 0,
				market: 0,
				wood: 0,
				stone: 0,
				iron: 0,
				farm: 0,
				wall: 0
			};
			
			var spyBuildingRows_left=VIJE_REF2.document.getElementById("attack_spy_buildings_left").rows;
			var spyBuildingRows_right=VIJE_REF2.document.getElementById("attack_spy_buildings_right").rows;
			for (var i=1;i<spyBuildingRows_left.length;i++) {
				let buildingName_l = spyBuildingRows_left[i].cells[0].textContent.toUpperCase().trim();
				let buildingName_r = spyBuildingRows_right[i].cells[0].textContent.toUpperCase().trim();
				for (const key in spyLevels) {
					if (buildingName_l.includes(i18nBuildings[key].value.toUpperCase())) spyLevels[key] = parseInt(spyBuildingRows_left[i].cells[1].textContent,10);
					if (buildingName_r.includes(i18nBuildings[key].value.toUpperCase())) spyLevels[key] = parseInt(spyBuildingRows_right[i].cells[1].textContent,10);
				}
			}
			SZEM4_FARM.DOMINFO_FARMS[adatok[1]].buildings = JSON.parse(JSON.stringify(spyLevels));
			// Update barb_intel with building data
			if (typeof SZEM4_BARB !== 'undefined' && SZEM4_BARB.ENABLED) {
				// Try to extract defender village ID from the report
				let defVillageId = null;
				try {
					const defLink = VIJE_REF2.document.querySelector('#attack_info_def a[href*="info_village"]');
					if (defLink) {
						const idMatch = defLink.href.match(/id=(\d+)/);
						if (idMatch) defVillageId = parseInt(idMatch[1], 10);
					}
				} catch(e) { debug('VIJE', 'Could not extract defender village ID: ' + e); }
				barb_updateIntel(adatok[1], spyLevels, hungarianDate, defVillageId);
			}
			if (spyLevels.wall === 0) {
				if (spyLevels.barracks === 0) {
					spyLevels.wall--;
					if (spyLevels.main === 2) spyLevels.wall--;
					if (spyLevels.main === 1) spyLevels.wall-=2;
				}
			}
			var banyak = [spyLevels.wood, spyLevels.stone, spyLevels.iron];
			var fal = spyLevels.wall;
		} else { /*Csak nyerset láttunk*/
			var banyak = '';
			var fal = '';
		}
		VIJE_adatbeir(adatok[1],nyersossz,banyak,fal,adatok[2], hungarianDate);
	} else if (!isOld) {
		var atkTable = VIJE_REF2.document.getElementById('attack_results');
		var fosztogatas = atkTable?atkTable.rows[0].cells[2].innerText.split('/').map(item => parseInt(item,10)):0;
		var nyers = '';
		if (fosztogatas[0] + 5 < fosztogatas[1]) {
			nyers=0;
			//debug('debug/szem4_VIJE_2elemzes', `VIJE_adatbeir(${adatok[1],nyers},'','',${adatok[2]}, ${hungarianDate}`);
			VIJE_adatbeir(adatok[1],nyers,'','',adatok[2], hungarianDate);
		}
	}
	
	/*Tedd be az elemzettek listájába az ID-t*/
	SZEM4_VIJE.ELEMZETT.push(adatok[0]);
	if (SZEM4_VIJE.ELEMZETT.length > 600) {
		SZEM4_VIJE.ELEMZETT.splice(0, SZEM4_VIJE.ELEMZETT.length - 250);
	}
	
	VIJE2_HIBA=0; VIJE2_GHIBA=0;
	return true;
}catch(e){debug("VIJE2","Elemezhetetlen jelentés: "+adatok[0]+":"+adatok[1]+". Hiba: "+e); VIJE_adatbeir(adatok[1],nyersossz,"","",adatok[2]); VIJE2_HIBA++; VIJE_HIBA++; return false;}}

function szem4_VIJE_3torol(){try{
	if (document.getElementById("vije_opts").isdelete.checked) {
		try{VIJE_REF1.document.forms[0].del.click();}catch(e){VIJE_REF1.document.getElementsByName("del")[0].click();}
	}
}catch(e){debug("VIJE3","Hiba: "+e);return;}}

function szem4_VIJE_motor(){try{
	var nexttime=1500;
	if (VIJE_PAUSE) clearAttacks();
	if (BOT||VIJE_PAUSE||USER_ACTIVITY) {nexttime=5000;}
	else if (NORBI0N_FARM_LEPES !== 0) {nexttime=3000;} // Wait for Norbi0N_Farm
	else {
	if (VIJE_HIBA>10) {
		VIJE_HIBA=0; VIJE_GHIBA++; 
		if(VIJE_GHIBA>3) {
			if (VIJE_GHIBA>5) {
				naplo("Globál","Nincs internet? Folyamatos hiba a jelentés elemzőnél"); nexttime=60000; playSound("bot2");
			}
			debug('szem4_VIJE_motor', 'Jelentés elemzo hiba >3, ablak bezár/újranyit');
			VIJE_REF1.close();
		} VIJE_LEPES=0;
	}
	
	if (VIJE2_HIBA>6) {VIJE2_HIBA=0; VIJE2_GHIBA++; if(VIJE2_GHIBA>3) {if (VIJE2_GHIBA>5) naplo("Globál","Nincs internet? Folyamatos hiba a jelentés elemzőnél"); VIJE_REF2.close();} VIJE_LEPES=0;}
	if (!VIJE_REF1 || (VIJE_LEPES!=0 && VIJE_REF1.closed)) VIJE_LEPES=0;
	
	switch(VIJE_LEPES) {
		case 0: /*Támadói jelentések megnyitása*/
			if (document.getElementById("farm_hova").rows.length>1) {
			var csoport="";
			if (game_data.player.premium) csoport="group_id=-1&";
			VIJE_REF1=windowOpener('vije', VILL1ST.replace("screen=overview","mode=attack&"+csoport+"screen=report"), AZON+"_SZEM4VIJE_1");
			VIJE_LEPES=1;
			} else nexttime=10000;
			break;
		case 1: /*Megnyitandó jelentés kiválasztás(+bepipálás)*/
			if (isPageLoaded(VIJE_REF1,-1,"screen=report")) {
				VIJE_HIBA=0; VIJE_GHIBA=0;
				PM2=szem4_VIJE_1kivalaszt();
				if (PM2[0]===0) { // Nincs meló
					VIJE_LEPES=0;
					if (PM2[3] === false) {
						nexttime=120000;
						if (MOBILE_MODE) {
							VIJE_REF1.close();
							VIJE_REF2.close();
						}
					}
				} else {
					VIJE_REF2=windowOpener('vije2', VILL1ST.replace("screen=overview","mode=attack&view="+PM2[0]+"&screen=report"), AZON+"_SZEM4VIJE_2");
					VIJE_LEPES=2;
				}
				VIJE_REF1.document.title = 'Szem4/vije1';
			} else { VIJE_HIBA++; }
			break;
		case 2: /*Megnyitott jelentés elemzése*/
			if (isPageLoaded(VIJE_REF2,-1,PM2[0])) {
				clearAttacks();
				szem4_VIJE_2elemzes(PM2);
				if (PM2[3]) VIJE_LEPES=3; else VIJE_LEPES=1;
				VIJE_REF2.document.title = 'Szem4/vije2';
			} else { VIJE2_HIBA++;}
			break;
		case 3: /*bepipált jelentések törlése*/
			szem4_VIJE_3torol();
			VIJE_LEPES=0;
			if (PM2[0]===0) {
				nexttime=120000;
				if (MOBILE_MODE) {
					VIJE_REF1.close();
					VIJE_REF2.close();
				}
			}
			break;
		default: VIJE_LEPES=0;
	}}
}catch(e){debug("szem4_VIJE_motor()","ERROR: "+e+" Lépés:"+VIJE_LEPES);}
var inga=100/((Math.random()*40)+80);
nexttime=Math.round(nexttime*inga);
try{
	worker.postMessage({'id': 'vije', 'time': nexttime});
}catch(e){debug('vije', 'Worker engine error: ' + e);setTimeout(function(){szem4_VIJE_motor();}, 3000);}}
/*VIJE*/
ujkieg("vije","Jelentés Elemző",`<tr><td>
	A VIJE a Farmoló táblázatába dolgozik, itt csupán működési beállításokat módosíthatsz.
	<form id="vije_opts">
		<table class="vis szem4_vije_optsTable">
			<tr><td>${picBuilding('main')}</td><td>"Főhadiszállás" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="main" value="Főhadiszállás"></td></tr>
			<tr><td>${picBuilding('barracks')}</td><td>"Barakk" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="barracks" value="Barakk"></td></tr>
			<tr><td>${picBuilding('stable')}</td><td>"Istálló" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="stable" value="Istálló"></td></tr>
			<tr><td>${picBuilding('garage')}</td><td>"Műhely" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="garage" value="Műhely"></td></tr>
			<tr><td>${picBuilding('smith')}</td><td>"Kovácsműhely" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="smith" value="Kovácsműhely"></td></tr>
			<tr><td>${picBuilding('market')}</td><td>"Piac" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="market" value="Piac"></td></tr>
			<tr><td>${picBuilding('wood')}</td><td>"Fatelep" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="wood" value="Fatelep"></td></tr>
			<tr><td>${picBuilding('stone')}</td><td>"Agyagbánya" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="stone" value="Agyagbánya"></td></tr>
			<tr><td>${picBuilding('iron')}</td><td>"Vasbánya" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="iron" value="Vasbánya"></td></tr>
			<tr><td>${picBuilding('farm')}</td><td>"Tanya" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="farm" value="Tanya"></td></tr>
			<tr><td>${picBuilding('wall')}</td><td>"Fal" a szerver jelenlegi nyelvén</td><td><input type="text" size="15" name="wall" value="Fal"></td></tr>
		</table>
		<input type="checkbox" name="isdelete"> Zöld farmjelentések törlése?<br>
		<input type="checkbox" name="isRelicMode"> Relic mód (új szerverekhez, ahol van Relikvia rendszer)<br>
		<button onclick="szem4_vije_forgot()" type="button">Jelentések újraelemzése/elfelejtése</button><br><br><br>
	</form>
	</td></tr>`);

var VIJE_PAUSE=true;
var VIJE_LEPES=0;
var VIJE_REF1; var VIJE_REF2;
var VIJE_HIBA=0; var VIJE_GHIBA=0;
var VIJE2_HIBA=0; var VIJE2_GHIBA=0;
var SZEM4_VIJE = {
	ALL_VIJE_SAVED: {}, // coord: date (legfrissebb elemzés a faluról),
	i18ns: {}, // épületId: fordítás
	ELEMZETT: [],
};
readUpVijeOpts();
var PM2;
szem4_VIJE_motor();

/*-----------------AUTO RECRUITMENT--------------------*/

// Global state variables
var RECRUITMENT_LEPES = 0;
var RECRUITMENT_REF = null;
var RECRUITMENT_PAUSE = true;
var RECRUITMENT_HIBA = 0;
var RECRUITMENT_GHIBA = 0;

var SZEM4_RECRUITMENT = {
	OPTIONS: {
		checkInterval: 5,      // minutes
		randomDelay: 1,        // minutes
		resourceBudget: 60,    // percent
		buildingDist: {
			barracks: 50,
			stable: 30,
			garage: 20
		},
		maxUnits: {
			barracks: 0,       // 0 = no limit
			stable: 0,
			garage: 0
		},
		loopMode: true
	},
	TEMPLATES: [],
	ACTIVE_TEMPLATE: null,
	CURRENT_PLAN: null,  // Store plan between LEPES 2 and 3
	ROTATION: {
		barracks: 0,
		stable: 0,
		garage: 0
	},
	STATS: {
		lastRun: 0,
		totalRuns: 0,
		totalRecruits: 0,
		errors: 0
	}
};

// Template Management Functions
function recruitment_createTemplate(name, units) {
	return {
		id: Date.now(),
		name: name,
		units: units  // {spear: 200, axe: 100, ...}
	};
}

function recruitment_addTemplate(template) {
	SZEM4_RECRUITMENT.TEMPLATES.push(template);
	recruitment_save();
	return template;
}

function recruitment_deleteTemplate(templateId) {
	SZEM4_RECRUITMENT.TEMPLATES = SZEM4_RECRUITMENT.TEMPLATES.filter(t => t.id !== templateId);
	if (SZEM4_RECRUITMENT.ACTIVE_TEMPLATE && SZEM4_RECRUITMENT.ACTIVE_TEMPLATE.id === templateId) {
		SZEM4_RECRUITMENT.ACTIVE_TEMPLATE = null;
	}
	recruitment_save();
}

function recruitment_setActive(templateId) {
	const template = SZEM4_RECRUITMENT.TEMPLATES.find(t => t.id === templateId);
	if (template) {
		SZEM4_RECRUITMENT.ACTIVE_TEMPLATE = template;
		recruitment_save();
		recruitment_renderTemplates();
		return true;
	}
	return false;
}

function recruitment_getTemplate(templateId) {
	return SZEM4_RECRUITMENT.TEMPLATES.find(t => t.id === templateId);
}

// Data Extraction Functions
function recruitment_extractResources(doc) {
	return {
		wood: parseInt(doc.getElementById('wood')?.textContent || 0),
		stone: parseInt(doc.getElementById('stone')?.textContent || 0),
		iron: parseInt(doc.getElementById('iron')?.textContent || 0)
	};
}

function recruitment_extractPopulation(doc) {
	const current = parseInt(doc.getElementById('pop_current_label')?.textContent || 0);
	const max = parseInt(doc.getElementById('pop_max_label')?.textContent || 0);
	return {
		current: current,
		max: max,
		available: max - current
	};
}

function recruitment_extractTroops(doc) {
	const troops = {};
	const unitRows = doc.querySelectorAll('table.vis tbody tr.row_a, table.vis tbody tr.row_b');

	unitRows.forEach(row => {
		const unitLink = row.querySelector('.unit_link');
		if (unitLink) {
			const unitType = unitLink.getAttribute('data-unit');
			const troopCountCell = row.querySelectorAll('td')[2];

			if (troopCountCell) {
				const countText = troopCountCell.textContent.trim();
				const match = countText.match(/(\d+)\/(\d+)/);

				if (match) {
					troops[unitType] = {
						inVillage: parseInt(match[1]),
						total: parseInt(match[2])
					};
				}
			}
		}
	});

	return troops;
}

function recruitment_extractUnitCosts(doc) {
	const costs = {};
	const unitRows = doc.querySelectorAll('table.vis tbody tr.row_a, table.vis tbody tr.row_b');

	unitRows.forEach(row => {
		const unitLink = row.querySelector('.unit_link');
		if (unitLink) {
			const unitType = unitLink.getAttribute('data-unit');

			costs[unitType] = {
				wood: parseInt(doc.getElementById(unitType + '_0_cost_wood')?.textContent || 0),
				stone: parseInt(doc.getElementById(unitType + '_0_cost_stone')?.textContent || 0),
				iron: parseInt(doc.getElementById(unitType + '_0_cost_iron')?.textContent || 0),
				pop: parseInt(doc.getElementById(unitType + '_0_cost_pop')?.textContent || 0)
			};
		}
	});

	return costs;
}

// Recruitment Calculator Functions
function recruitment_calculateNeeded(template, currentTroops) {
	const needed = {};

	for (const [unitType, goalAmount] of Object.entries(template.units)) {
		const currentAmount = currentTroops[unitType]?.inVillage || 0;
		const difference = goalAmount - currentAmount;

		if (difference > 0) {
			needed[unitType] = difference;
		}
	}

	return needed;
}

function recruitment_getNextUnit(building, neededUnits) {
	const buildingUnits = {
		barracks: ['spear', 'sword', 'axe', 'archer'],
		stable: ['spy', 'light', 'marcher', 'heavy'],
		garage: ['ram', 'catapult']
	};

	const availableUnits = buildingUnits[building].filter(u => neededUnits[u] > 0);
	if (availableUnits.length === 0) return null;

	const rotation = SZEM4_RECRUITMENT.ROTATION[building];
	const nextUnit = availableUnits[rotation % availableUnits.length];
	SZEM4_RECRUITMENT.ROTATION[building] = (rotation + 1) % availableUnits.length;

	return nextUnit;
}

function recruitment_calculateAffordable(unitType, resources, population, unitCosts) {
	const cost = unitCosts[unitType];
	if (!cost) return 0;

	const affordableByWood = cost.wood > 0 ? Math.floor(resources.wood / cost.wood) : 999999;
	const affordableByStone = cost.stone > 0 ? Math.floor(resources.stone / cost.stone) : 999999;
	const affordableByIron = cost.iron > 0 ? Math.floor(resources.iron / cost.iron) : 999999;
	const affordableByPop = cost.pop > 0 ? Math.floor(population.available / cost.pop) : 999999;

	return Math.min(affordableByWood, affordableByStone, affordableByIron, affordableByPop);
}

function recruitment_calculatePlan(gameData) {
	const template = SZEM4_RECRUITMENT.ACTIVE_TEMPLATE;
	if (!template) return null;

	const needed = recruitment_calculateNeeded(template, gameData.troops);
	if (Object.keys(needed).length === 0) {
		return { units: {}, message: 'Template complete' };
	}

	const result = {};

	// Calculate budget
	const budget = SZEM4_RECRUITMENT.OPTIONS.resourceBudget / 100;
	const totalBudget = {
		wood: Math.floor(gameData.resources.wood * budget),
		stone: Math.floor(gameData.resources.stone * budget),
		iron: Math.floor(gameData.resources.iron * budget)
	};

	// Try each building
	for (const building of ['barracks', 'stable', 'garage']) {
		const unitType = recruitment_getNextUnit(building, needed);
		if (!unitType) continue;

		const buildingBudget = {
			wood: Math.floor(totalBudget.wood * SZEM4_RECRUITMENT.OPTIONS.buildingDist[building] / 100),
			stone: Math.floor(totalBudget.stone * SZEM4_RECRUITMENT.OPTIONS.buildingDist[building] / 100),
			iron: Math.floor(totalBudget.iron * SZEM4_RECRUITMENT.OPTIONS.buildingDist[building] / 100)
		};

		const affordable = recruitment_calculateAffordable(unitType, buildingBudget, gameData.population, gameData.unitCosts);
		let amount = Math.min(affordable, needed[unitType]);

		// Apply max units per cycle limit if set (with safety check for old saves)
		const maxUnits = SZEM4_RECRUITMENT.OPTIONS.maxUnits || {};
		const maxLimit = maxUnits[building] || 0;
		if (maxLimit > 0 && amount > maxLimit) {
			amount = maxLimit;
		}

		if (amount > 0) {
			result[unitType] = amount;
		}
	}

	return { units: result, message: Object.keys(result).length > 0 ? 'Plan ready' : 'Insufficient resources' };
}

// State Machine Motor Function
function szem4_recruitment_motor() {
	try {
		// Check pause state
		if (RECRUITMENT_PAUSE) {
			worker.postMessage({'id': 'recruitment', 'time': 5000});
			return;
		}

		// Check if template is set
		if (!SZEM4_RECRUITMENT.ACTIVE_TEMPLATE) {
			recruitment_log('No active template selected - pausing', 'warn');
			naplo('Recruitment', 'No active template - paused');
			RECRUITMENT_PAUSE = true;
			return;
		}

		// Error handling
		if (RECRUITMENT_HIBA > 3) {
			RECRUITMENT_HIBA = 0;
			RECRUITMENT_GHIBA++;
			RECRUITMENT_LEPES = 0;
			recruitment_log(`Too many errors in cycle, resetting (global errors: ${RECRUITMENT_GHIBA})`, 'error');
		}
		if (RECRUITMENT_GHIBA > 5) {
			recruitment_log('Too many global errors - stopping recruitment', 'error');
			naplo('Recruitment', 'Stopped due to too many errors');
			RECRUITMENT_PAUSE = true;
			SZEM4_RECRUITMENT.STATS.errors++;
			recruitment_save();
			return;
		}

		let nexttime = 5000;

		switch (RECRUITMENT_LEPES) {
			case 0: // Idle - wait for interval
				const now = Date.now();
				const lastRun = SZEM4_RECRUITMENT.STATS.lastRun;
				const interval = SZEM4_RECRUITMENT.OPTIONS.checkInterval * 60 * 1000;
				const randomDelay = Math.random() * SZEM4_RECRUITMENT.OPTIONS.randomDelay * 60 * 1000;

				if (now - lastRun >= interval + randomDelay || lastRun === 0) {
					recruitment_log('Starting recruitment cycle...', 'info');
					naplo('Recruitment', 'Starting cycle for template: ' + SZEM4_RECRUITMENT.ACTIVE_TEMPLATE.name);
					RECRUITMENT_LEPES = 1;
					nexttime = 1000;
				} else {
					nexttime = 10000; // Check every 10s
				}
				break;

			case 1: // Open worker tab
				try {
					recruitment_log('Opening train page...', 'info');
					const url = `/game.php?village=${game_data.village.id}&screen=train`;
					RECRUITMENT_REF = window.open(url, '_blank');

					if (!RECRUITMENT_REF) {
						recruitment_log('Failed to open worker tab (popup blocked?)', 'error');
						RECRUITMENT_HIBA++;
						RECRUITMENT_LEPES = 0;
					} else {
						recruitment_log('Train page opened, waiting for load...', 'info');
						RECRUITMENT_LEPES = 2;
						nexttime = 3000; // Wait for load
					}
				} catch(e) {
					recruitment_log('Error opening tab: ' + e, 'error');
					RECRUITMENT_HIBA++;
					RECRUITMENT_LEPES = 0;
				}
				break;

			case 2: // Extract data & calculate
				try {
					if (!RECRUITMENT_REF || RECRUITMENT_REF.closed) {
						recruitment_log('Worker tab was closed unexpectedly', 'warn');
						RECRUITMENT_LEPES = 0;
						break;
					}

					recruitment_log('Extracting game data...', 'info');
					const doc = RECRUITMENT_REF.document;
					const gameData = {
						resources: recruitment_extractResources(doc),
						population: recruitment_extractPopulation(doc),
						troops: recruitment_extractTroops(doc),
						unitCosts: recruitment_extractUnitCosts(doc)
					};

					recruitment_log(`Resources: W:${gameData.resources.wood} S:${gameData.resources.stone} I:${gameData.resources.iron} | Pop: ${gameData.population.available}/${gameData.population.max}`, 'info');

					const planResult = recruitment_calculatePlan(gameData);

					if (!planResult || Object.keys(planResult.units).length === 0) {
						recruitment_log('No units to recruit: ' + (planResult?.message || 'unknown'), 'info');
						RECRUITMENT_REF.close();
						RECRUITMENT_LEPES = 0;
						SZEM4_RECRUITMENT.STATS.lastRun = Date.now();
						SZEM4_RECRUITMENT.STATS.totalRuns++;
						recruitment_save();
					} else {
						const planStr = Object.entries(planResult.units).map(([u,q]) => `${u}:${q}`).join(', ');
						recruitment_log('Recruitment plan: ' + planStr, 'success');
						SZEM4_RECRUITMENT.CURRENT_PLAN = planResult.units;
						RECRUITMENT_LEPES = 3;
						nexttime = 500;
					}
				} catch(e) {
					recruitment_log('Error extracting data: ' + e, 'error');
					if (RECRUITMENT_REF && !RECRUITMENT_REF.closed) RECRUITMENT_REF.close();
					RECRUITMENT_HIBA++;
					SZEM4_RECRUITMENT.STATS.errors++;
					RECRUITMENT_LEPES = 0;
				}
				break;

			case 3: // Submit recruitment
				try {
					if (!RECRUITMENT_REF || RECRUITMENT_REF.closed) {
						recruitment_log('Worker tab was closed before submit', 'warn');
						RECRUITMENT_LEPES = 0;
						break;
					}

					const doc = RECRUITMENT_REF.document;
					const form = doc.getElementById('train_form');

					if (!form) {
						recruitment_log('Train form not found on page', 'error');
						RECRUITMENT_REF.close();
						RECRUITMENT_HIBA++;
						SZEM4_RECRUITMENT.STATS.errors++;
						RECRUITMENT_LEPES = 0;
						break;
					}

					// Fill form with plan
					let filledAny = false;
					let filledUnits = [];
					for (const [unitType, quantity] of Object.entries(SZEM4_RECRUITMENT.CURRENT_PLAN)) {
						const input = doc.getElementById(unitType + '_0');
						if (input) {
							input.value = quantity;
							filledAny = true;
							filledUnits.push(`${unitType}:${quantity}`);
						}
					}

					if (!filledAny) {
						recruitment_log('No unit inputs could be filled', 'error');
						RECRUITMENT_REF.close();
						RECRUITMENT_HIBA++;
						SZEM4_RECRUITMENT.STATS.errors++;
						RECRUITMENT_LEPES = 0;
						break;
					}

					recruitment_log('Submitting recruitment form...', 'info');
					form.submit();

					SZEM4_RECRUITMENT.STATS.totalRecruits++;
					SZEM4_RECRUITMENT.STATS.totalRuns++;
					SZEM4_RECRUITMENT.STATS.lastRun = Date.now();

					const recruitMsg = filledUnits.join(', ');
					recruitment_log('SUCCESS! Recruited: ' + recruitMsg, 'success');
					naplo('Recruitment', 'Recruited: ' + recruitMsg);

					recruitment_save();
					recruitment_updateStats();

					setTimeout(() => {
						if (RECRUITMENT_REF && !RECRUITMENT_REF.closed) {
							RECRUITMENT_REF.close();
						}
					}, 2000);

					SZEM4_RECRUITMENT.CURRENT_PLAN = null;
					RECRUITMENT_LEPES = 0;
					nexttime = 1000;
				} catch(e) {
					recruitment_log('Error submitting: ' + e, 'error');
					if (RECRUITMENT_REF && !RECRUITMENT_REF.closed) RECRUITMENT_REF.close();
					RECRUITMENT_HIBA++;
					SZEM4_RECRUITMENT.STATS.errors++;
					RECRUITMENT_LEPES = 0;
				}
				break;

			default:
				RECRUITMENT_LEPES = 0;
		}

		worker.postMessage({'id': 'recruitment', 'time': nexttime});

	} catch(e) {
		recruitment_log('Motor error: ' + e, 'error');
		debug('szem4_recruitment_motor()', e + ' Lépés:' + RECRUITMENT_LEPES);
		RECRUITMENT_LEPES = 0;
	}
}

// Save/Load Functions
function recruitment_save() {
	try {
		localStorage.setItem(AZON + "_recruitment", JSON.stringify(SZEM4_RECRUITMENT));
		return true;
	} catch(e) {
		debug('Recruitment', 'Save error: ' + e);
		return false;
	}
}

function recruitment_load() {
	try {
		const saved = localStorage.getItem(AZON + "_recruitment");
		if (saved) {
			const loaded = JSON.parse(saved);
			SZEM4_RECRUITMENT = Object.assign(SZEM4_RECRUITMENT, loaded);
			// Ensure maxUnits exists for old saves that don't have it
			if (!SZEM4_RECRUITMENT.OPTIONS.maxUnits) {
				SZEM4_RECRUITMENT.OPTIONS.maxUnits = {
					barracks: 0,
					stable: 0,
					garage: 0
				};
			}
			debug('Recruitment', 'Loaded from storage');
		}
	} catch(e) {
		debug('Recruitment', 'Load error: ' + e);
	}
}

// UI Functions
function recruitment_renderTemplates() {
	const tbody = document.querySelector('#recruitment_templates tbody');
	if (!tbody) return;

	// Clear existing rows except header
	while (tbody.rows.length > 1) {
		tbody.deleteRow(1);
	}

	if (SZEM4_RECRUITMENT.TEMPLATES.length === 0) {
		const row = tbody.insertRow();
		const cell = row.insertCell(0);
		cell.colSpan = 3;
		cell.style.textAlign = 'center';
		cell.style.fontStyle = 'italic';
		cell.textContent = 'No templates created yet';
		return;
	}

	SZEM4_RECRUITMENT.TEMPLATES.forEach(template => {
		const row = tbody.insertRow();
		const isActive = SZEM4_RECRUITMENT.ACTIVE_TEMPLATE && SZEM4_RECRUITMENT.ACTIVE_TEMPLATE.id === template.id;

		if (isActive) {
			row.style.backgroundColor = '#d4e4bc';
			row.style.fontWeight = 'bold';
		}

		// Name cell
		const nameCell = row.insertCell(0);
		nameCell.textContent = template.name + (isActive ? ' ★' : '');

		// Units cell
		const unitsCell = row.insertCell(1);
		const unitCount = Object.keys(template.units).length;
		const totalUnits = Object.values(template.units).reduce((sum, val) => sum + val, 0);
		unitsCell.textContent = `${unitCount} types, ${totalUnits} total`;

		// Actions cell
		const actionsCell = row.insertCell(2);
		actionsCell.innerHTML = `
			<button onclick="recruitment_setActive(${template.id})" class="btn" ${isActive ? 'disabled' : ''}>Select</button>
			<button onclick="recruitment_showTemplateEditor(${template.id})" class="btn">Edit</button>
			<button onclick="recruitment_confirmDelete(${template.id})" class="btn">Delete</button>
		`;
	});

	recruitment_updateStats();
}

function recruitment_showTemplateEditor(templateId = null) {
	const isEdit = templateId !== null;
	const template = isEdit ? recruitment_getTemplate(templateId) : null;

	const unitTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult'];

	let unitInputs = '';
	unitTypes.forEach(unitType => {
		const currentValue = template ? (template.units[unitType] || 0) : 0;
		unitInputs += `
			<tr>
				<td>${unitType.charAt(0).toUpperCase() + unitType.slice(1)}:</td>
				<td><input type="number" class="template-unit-input" data-unit="${unitType}" min="0" value="${currentValue}"></td>
			</tr>
		`;
	});

	const dialogHTML = `
		<div id="templateEditorDialog" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 2px solid #7d510f; border-radius: 8px; padding: 20px; z-index: 10000; min-width: 400px; max-width: 600px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: black;">
			<h3 style="margin-top: 0; color: black;">${isEdit ? 'Edit Template' : 'Create New Template'}</h3>

			<label style="display: block; margin-bottom: 15px;">
				Template Name:
				<input type="text" id="templateName" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #c1a264; border-radius: 3px;" value="${template ? template.name : ''}">
			</label>

			<div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 15px; border-radius: 3px;">
				<h4 style="margin-top: 0;">Unit Goals</h4>
				<table class="vis" style="width: 100%;">
					${unitInputs}
				</table>
			</div>

			<div style="display: flex; gap: 10px; justify-content: flex-end;">
				<button id="templateSave" class="btn">Save</button>
				<button id="templateCancel" class="btn">Cancel</button>
			</div>
		</div>

		<div id="templateEditorOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;"></div>
	`;

	const container = document.createElement('div');
	container.innerHTML = dialogHTML;
	document.body.appendChild(container);

	// Event listeners
	document.getElementById('templateSave').addEventListener('click', function() {
		const name = document.getElementById('templateName').value.trim();
		if (!name) {
			alert('Please enter a template name');
			return;
		}

		const units = {};
		document.querySelectorAll('.template-unit-input').forEach(input => {
			const unitType = input.getAttribute('data-unit');
			const value = parseInt(input.value) || 0;
			if (value > 0) {
				units[unitType] = value;
			}
		});

		if (Object.keys(units).length === 0) {
			alert('Please set at least one unit goal');
			return;
		}

		if (isEdit) {
			const existingTemplate = recruitment_getTemplate(templateId);
			existingTemplate.name = name;
			existingTemplate.units = units;
			recruitment_save();
			naplo('Recruitment', 'Template updated: ' + name);
		} else {
			const newTemplate = recruitment_createTemplate(name, units);
			recruitment_addTemplate(newTemplate);
			naplo('Recruitment', 'Template created: ' + name);
		}

		recruitment_renderTemplates();
		container.remove();
	});

	document.getElementById('templateCancel').addEventListener('click', function() {
		container.remove();
	});

	document.getElementById('templateEditorOverlay').addEventListener('click', function() {
		container.remove();
	});
}

function recruitment_confirmDelete(templateId) {
	const template = recruitment_getTemplate(templateId);
	if (!template) return;

	if (confirm(`Are you sure you want to delete template "${template.name}"?`)) {
		recruitment_deleteTemplate(templateId);
		recruitment_renderTemplates();
		naplo('Recruitment', 'Template deleted: ' + template.name);
	}
}

function recruitment_saveSettings() {
	try {
		SZEM4_RECRUITMENT.OPTIONS.checkInterval = parseInt(document.getElementById('recruitment_interval').value) || 5;
		SZEM4_RECRUITMENT.OPTIONS.randomDelay = parseInt(document.getElementById('recruitment_delay').value) || 1;
		SZEM4_RECRUITMENT.OPTIONS.resourceBudget = parseInt(document.getElementById('recruitment_budget').value) || 60;
		SZEM4_RECRUITMENT.OPTIONS.buildingDist.barracks = parseInt(document.getElementById('recruitment_barracks').value) || 50;
		SZEM4_RECRUITMENT.OPTIONS.buildingDist.stable = parseInt(document.getElementById('recruitment_stable').value) || 30;
		SZEM4_RECRUITMENT.OPTIONS.buildingDist.garage = parseInt(document.getElementById('recruitment_garage').value) || 20;
		SZEM4_RECRUITMENT.OPTIONS.maxUnits.barracks = parseInt(document.getElementById('recruitment_max_barracks').value) || 0;
		SZEM4_RECRUITMENT.OPTIONS.maxUnits.stable = parseInt(document.getElementById('recruitment_max_stable').value) || 0;
		SZEM4_RECRUITMENT.OPTIONS.maxUnits.garage = parseInt(document.getElementById('recruitment_max_garage').value) || 0;

		// Validate building distribution
		const total = SZEM4_RECRUITMENT.OPTIONS.buildingDist.barracks +
		              SZEM4_RECRUITMENT.OPTIONS.buildingDist.stable +
		              SZEM4_RECRUITMENT.OPTIONS.buildingDist.garage;

		if (total !== 100) {
			alert('Building distribution must total 100%!');
			return false;
		}

		recruitment_save();
		alert2('Settings saved successfully');
		return true;
	} catch(e) {
		debug('Recruitment', 'Error saving settings: ' + e);
		return false;
	}
}

function recruitment_loadSettings() {
	try {
		if (document.getElementById('recruitment_interval')) {
			document.getElementById('recruitment_interval').value = SZEM4_RECRUITMENT.OPTIONS.checkInterval;
			document.getElementById('recruitment_delay').value = SZEM4_RECRUITMENT.OPTIONS.randomDelay;
			document.getElementById('recruitment_budget').value = SZEM4_RECRUITMENT.OPTIONS.resourceBudget;
			document.getElementById('recruitment_barracks').value = SZEM4_RECRUITMENT.OPTIONS.buildingDist.barracks;
			document.getElementById('recruitment_stable').value = SZEM4_RECRUITMENT.OPTIONS.buildingDist.stable;
			document.getElementById('recruitment_garage').value = SZEM4_RECRUITMENT.OPTIONS.buildingDist.garage;
			// Load max units settings (with fallback to 0 for old saves)
			document.getElementById('recruitment_max_barracks').value = SZEM4_RECRUITMENT.OPTIONS.maxUnits?.barracks || 0;
			document.getElementById('recruitment_max_stable').value = SZEM4_RECRUITMENT.OPTIONS.maxUnits?.stable || 0;
			document.getElementById('recruitment_max_garage').value = SZEM4_RECRUITMENT.OPTIONS.maxUnits?.garage || 0;
		}
	} catch(e) {
		debug('Recruitment', 'Error loading settings: ' + e);
	}
}

function recruitment_updateStats() {
	try {
		if (document.getElementById('recruitment_stat_runs')) {
			document.getElementById('recruitment_stat_runs').textContent = SZEM4_RECRUITMENT.STATS.totalRuns;
			document.getElementById('recruitment_stat_recruits').textContent = SZEM4_RECRUITMENT.STATS.totalRecruits;
			document.getElementById('recruitment_stat_lastrun').textContent =
				SZEM4_RECRUITMENT.STATS.lastRun ? new Date(SZEM4_RECRUITMENT.STATS.lastRun).toLocaleString() : 'Never';
			document.getElementById('recruitment_stat_errors').textContent = SZEM4_RECRUITMENT.STATS.errors;
		}
	} catch(e) {
		debug('Recruitment', 'Error updating stats: ' + e);
	}
}

// Initialize recruitment
recruitment_load();
szem4_recruitment_motor();

// Add Recruitment UI
ujkieg("recruitment","Recruitment",`<tr><td>
	<h2 align="center">Auto Recruitment System</h2>

	<!-- Status Section -->
	<div style="background: #e8d4a0; border: 2px solid #7d510f; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
		<h3 style="margin-top: 0;">Status</h3>
		<table class="vis" style="width: 100%;">
			<tr>
				<td style="width: 150px;"><b>Status:</b></td>
				<td><span id="recruitment_status" style="padding: 3px 10px; border-radius: 3px; font-weight: bold;">PAUSED</span></td>
			</tr>
			<tr>
				<td><b>Active Template:</b></td>
				<td id="recruitment_active_template">None selected</td>
			</tr>
			<tr>
				<td><b>Current Step:</b></td>
				<td id="recruitment_current_step">Idle</td>
			</tr>
			<tr>
				<td><b>Last Run:</b></td>
				<td id="recruitment_last_run">Never</td>
			</tr>
			<tr>
				<td><b>Next Run:</b></td>
				<td id="recruitment_next_run">-</td>
			</tr>
			<tr>
				<td><b>Countdown:</b></td>
				<td><span id="recruitment_countdown" style="font-family: monospace; font-size: 16px; font-weight: bold;">--:--</span></td>
			</tr>
		</table>
	</div>

	<!-- Templates Section -->
	<h3>Templates</h3>
	<table class="vis" id="recruitment_templates" style="width: 100%;">
		<tbody>
			<tr>
				<th>Name</th>
				<th>Units</th>
				<th>Actions</th>
			</tr>
		</tbody>
	</table>
	<p align="center">
		<button onclick="recruitment_showTemplateEditor()" class="btn">Create New Template</button>
	</p>

	<!-- Settings Section -->
	<h3>Settings</h3>
	<table class="vis" style="margin: auto;">
		<tr>
			<td>Check Interval (minutes):</td>
			<td><input type="number" id="recruitment_interval" min="1" value="5" style="width: 80px;"></td>
		</tr>
		<tr>
			<td>Random Delay (minutes):</td>
			<td><input type="number" id="recruitment_delay" min="0" value="1" style="width: 80px;"></td>
		</tr>
		<tr>
			<td>Resource Budget (%):</td>
			<td><input type="number" id="recruitment_budget" min="1" max="100" value="60" style="width: 80px;"></td>
		</tr>
		<tr>
			<td colspan="2"><b>Building Distribution (must total 100%)</b></td>
		</tr>
		<tr>
			<td>Barracks (%):</td>
			<td><input type="number" id="recruitment_barracks" value="50" style="width: 80px;"></td>
		</tr>
		<tr>
			<td>Stable (%):</td>
			<td><input type="number" id="recruitment_stable" value="30" style="width: 80px;"></td>
		</tr>
		<tr>
			<td>Garage (%):</td>
			<td><input type="number" id="recruitment_garage" value="20" style="width: 80px;"></td>
		</tr>
		<tr>
			<td colspan="2"><b>Max Units Per Cycle (0 = no limit)</b></td>
		</tr>
		<tr>
			<td>Barracks max:</td>
			<td><input type="number" id="recruitment_max_barracks" min="0" value="0" style="width: 80px;"></td>
		</tr>
		<tr>
			<td>Stable max:</td>
			<td><input type="number" id="recruitment_max_stable" min="0" value="0" style="width: 80px;"></td>
		</tr>
		<tr>
			<td>Garage max:</td>
			<td><input type="number" id="recruitment_max_garage" min="0" value="0" style="width: 80px;"></td>
		</tr>
		<tr>
			<td colspan="2" align="center" style="padding-top: 10px;">
				<button onclick="recruitment_saveSettings()" class="btn">Save Settings</button>
			</td>
		</tr>
	</table>

	<!-- Statistics Section -->
	<h3>Statistics</h3>
	<table class="vis" style="margin: auto;">
		<tr>
			<td>Total Runs:</td>
			<td id="recruitment_stat_runs">0</td>
		</tr>
		<tr>
			<td>Successful Recruits:</td>
			<td id="recruitment_stat_recruits">0</td>
		</tr>
		<tr>
			<td>Errors:</td>
			<td id="recruitment_stat_errors">0</td>
		</tr>
	</table>
	<p align="center" style="margin-top: 10px;">
		<button onclick="recruitment_resetStats()" class="btn">Reset Statistics</button>
	</p>

	<!-- Log Section -->
	<h3>Activity Log</h3>
	<div id="recruitment_log" style="background: #1a1a1a; color: #00ff00; font-family: monospace; font-size: 12px; padding: 10px; height: 150px; overflow-y: auto; border: 1px solid #7d510f; border-radius: 4px;">
		<div style="color: #888;">Waiting for activity...</div>
	</div>

	<!-- Instructions -->
	<h3>How to Use</h3>
	<ol style="text-align: left; max-width: 800px; margin: auto;">
		<li>Create a template with your desired troop goals</li>
		<li>Select the template you want to use (click "Select" button)</li>
		<li>Adjust settings if needed (check interval, resource budget, etc.)</li>
		<li>Click the RECRUITMENT button in the top menu to start/pause</li>
		<li>The system will automatically recruit troops based on your template</li>
	</ol>
</td></tr>`);

// Recruitment Log Function
function recruitment_log(message, type = 'info') {
	const logDiv = document.getElementById('recruitment_log');
	if (!logDiv) return;

	const timestamp = new Date().toLocaleTimeString();
	const colors = {
		'info': '#00ff00',
		'warn': '#ffff00',
		'error': '#ff4444',
		'success': '#44ff44'
	};
	const color = colors[type] || colors.info;

	const entry = document.createElement('div');
	entry.style.color = color;
	entry.innerHTML = `[${timestamp}] ${message}`;

	// Remove "waiting" message if present
	const waiting = logDiv.querySelector('div[style*="color: #888"]');
	if (waiting) waiting.remove();

	logDiv.appendChild(entry);
	logDiv.scrollTop = logDiv.scrollHeight;

	// Keep only last 50 entries
	while (logDiv.children.length > 50) {
		logDiv.removeChild(logDiv.firstChild);
	}
}

// Reset Statistics
function recruitment_resetStats() {
	if (confirm('Are you sure you want to reset all statistics?')) {
		SZEM4_RECRUITMENT.STATS = {
			lastRun: 0,
			totalRuns: 0,
			totalRecruits: 0,
			errors: 0
		};
		recruitment_save();
		recruitment_updateStats();
		recruitment_log('Statistics reset', 'info');
		naplo('Recruitment', 'Statistics reset');
	}
}

// Update Status UI
function recruitment_updateStatusUI() {
	// Status badge
	const statusEl = document.getElementById('recruitment_status');
	if (statusEl) {
		if (RECRUITMENT_PAUSE) {
			statusEl.textContent = 'PAUSED';
			statusEl.style.backgroundColor = '#ffcccc';
			statusEl.style.color = '#8B0000';
		} else {
			statusEl.textContent = 'RUNNING';
			statusEl.style.backgroundColor = '#ccffcc';
			statusEl.style.color = '#006400';
		}
	}

	// Active template
	const templateEl = document.getElementById('recruitment_active_template');
	if (templateEl) {
		if (SZEM4_RECRUITMENT.ACTIVE_TEMPLATE) {
			const t = SZEM4_RECRUITMENT.ACTIVE_TEMPLATE;
			const unitCount = Object.keys(t.units).length;
			templateEl.innerHTML = `<b>${t.name}</b> (${unitCount} unit types)`;
		} else {
			templateEl.innerHTML = '<span style="color: red;">None selected - select a template first!</span>';
		}
	}

	// Current step
	const stepEl = document.getElementById('recruitment_current_step');
	if (stepEl) {
		const steps = ['Waiting for next cycle', 'Opening train page', 'Extracting data', 'Submitting recruitment'];
		stepEl.textContent = steps[RECRUITMENT_LEPES] || 'Unknown';
	}

	// Last run
	const lastRunEl = document.getElementById('recruitment_last_run');
	if (lastRunEl) {
		if (SZEM4_RECRUITMENT.STATS.lastRun) {
			lastRunEl.textContent = new Date(SZEM4_RECRUITMENT.STATS.lastRun).toLocaleString();
		} else {
			lastRunEl.textContent = 'Never';
		}
	}

	// Next run & Countdown
	const nextRunEl = document.getElementById('recruitment_next_run');
	const countdownEl = document.getElementById('recruitment_countdown');

	if (RECRUITMENT_PAUSE || !SZEM4_RECRUITMENT.STATS.lastRun) {
		if (nextRunEl) nextRunEl.textContent = '-';
		if (countdownEl) countdownEl.textContent = '--:--';
	} else {
		const interval = SZEM4_RECRUITMENT.OPTIONS.checkInterval * 60 * 1000;
		const nextRun = SZEM4_RECRUITMENT.STATS.lastRun + interval;
		const now = Date.now();
		const remaining = Math.max(0, nextRun - now);

		if (nextRunEl) {
			nextRunEl.textContent = new Date(nextRun).toLocaleTimeString();
		}

		if (countdownEl) {
			if (remaining <= 0) {
				countdownEl.textContent = 'Running...';
				countdownEl.style.color = '#00ff00';
			} else {
				const mins = Math.floor(remaining / 60000);
				const secs = Math.floor((remaining % 60000) / 1000);
				countdownEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
				countdownEl.style.color = remaining < 30000 ? '#ffff00' : '#ffffff';
			}
		}
	}
}

// Load UI settings after panel is created
setTimeout(() => {
	recruitment_loadSettings();
	recruitment_renderTemplates();
	recruitment_updateStats();
	recruitment_updateStatusUI();

	// Start UI update interval
	setInterval(recruitment_updateStatusUI, 1000);
}, 500);

/*-----------------TÁMADÁS FIGYELŐ--------------------*/

function TamadUpdt(lap){try{
	var table=document.getElementById("idtamad_Bejovok");
	var d=getServerTime();
	var jelenlegi=parseInt(lap.game_data.player.incomings,10);
	var eddigi=0;
	if (table.rows.length>1) eddigi=parseInt(table.rows[1].cells[1].innerHTML,10);
	if (jelenlegi==eddigi) return;
	
	var row=table.insertRow(1);
	var cell1=row.insertCell(0);
	var cell2=row.insertCell(1);
	cell1.innerHTML=d;
	cell2.innerHTML=jelenlegi;
	
	if (jelenlegi>eddigi) playSound("bejovo"); /*replace: ATTACK SOUND!*/
	return;
}catch(e){debug("ID beir","Hiba: "+e);}}

ujkieg_hang("Bejövő támadások","bejovo");
ujkieg("idtamad","Bejövő támadások",'<tr><td align="center"><table class="vis" id="idtamad_Bejovok" style="vertical-align:top; display: inline-block;"><tr><th>Időpont</th><th>Támadások száma</th></tr></table> </td></tr>');

/*-----------------BARB (Barbarian Village Control)--------------------*/
var BARB_LEPES = 0;
var BARB_REF = null;
var BARB_PAUSE = true;
var BARB_HIBA = 0;
var BARB_GHIBA = 0;
var BARB_CURRENT_TARGET = null;

var SZEM4_BARB = {
	ENABLED: false,
	INTEL: {}, // coord: { buildings, reportAge, lastUpdated, distance, attackSent }
	CONFIG: {
		maxMain: 1,
		maxWall: 0,
		maxBarracks: 0,
		maxStable: 0,
		maxGarage: 0,
		maxMarket: 20,
		maxSmith: 20
	},
	OPTIONS: {
		attackDelay: 1250, // ms between attacks (1000-1500 randomized)
		axesToSend: 10,
		spyToSend: 1,
		safetyMargin: 1.2, // 20% extra siege units
		maxDistance: 30, // max fields from current village
		fromVillage: '' // source village for attacks
	},
	QUEUE: [], // attack queue
	STATS: {
		attacksSent: 0,
		lastAttack: null
	}
};

/**
 * Rams needed per wall level (Tribal Wars practical values)
 * Index = wall level, value = minimum rams needed to destroy that level
 * These are conservative estimates assuming rams survive the battle
 */
const RAMS_PER_WALL_LEVEL = [
	0,   // level 0 - no wall
	3,   // level 1
	5,   // level 2
	8,   // level 3
	10,  // level 4
	13,  // level 5
	16,  // level 6
	19,  // level 7
	23,  // level 8
	27,  // level 9
	31,  // level 10
	36,  // level 11
	41,  // level 12
	46,  // level 13
	52,  // level 14
	58,  // level 15
	65,  // level 16
	72,  // level 17
	80,  // level 18
	88,  // level 19
	97   // level 20
];

/**
 * Catapults needed per building level (Tribal Wars practical values)
 * These are minimum catapults to reliably destroy ONE level
 * Formula: ~2-3 catapults per building level for reliable destruction
 */
const CATA_PER_BUILDING_LEVEL = [
	0,   // level 0
	3,   // level 1
	5,   // level 2
	7,   // level 3
	9,   // level 4
	12,  // level 5
	14,  // level 6
	17,  // level 7
	20,  // level 8
	23,  // level 9
	26,  // level 10
	30,  // level 11
	34,  // level 12
	38,  // level 13
	42,  // level 14
	47,  // level 15
	52,  // level 16
	57,  // level 17
	63,  // level 18
	69,  // level 19
	75,  // level 20
	82,  // level 21
	89,  // level 22
	97,  // level 23
	105, // level 24
	114  // level 25
];

/**
 * Calculate number of rams needed to destroy wall from current level to target level
 * Uses practical Tribal Wars values - rams destroy ALL levels to target in one attack
 * @param {number} currentLevel - Current wall level
 * @param {number} targetLevel - Target wall level (from config)
 * @returns {number} Number of rams needed
 */
function barb_calculateRamsNeeded(currentLevel, targetLevel) {
	if (currentLevel <= targetLevel) return 0;

	// Rams can destroy multiple wall levels in one attack
	// We need enough rams to destroy the highest level (currentLevel)
	// Lower levels will be destroyed along the way
	const baseRams = RAMS_PER_WALL_LEVEL[currentLevel] || (currentLevel * 5);

	// Apply safety margin
	const ramsNeeded = Math.ceil(baseRams * SZEM4_BARB.OPTIONS.safetyMargin);

	debug('barb_calculateRamsNeeded', `Wall ${currentLevel} -> ${targetLevel}: need ${ramsNeeded} rams (base: ${baseRams})`);
	return Math.max(ramsNeeded, 1);
}

/**
 * Calculate number of catapults needed to destroy building from current level to target level
 * Catapults destroy ONE level per attack, so we calculate for the current (highest) level
 * @param {string} buildingType - Type of building (main, barracks, stable, garage, market, smith)
 * @param {number} currentLevel - Current building level
 * @param {number} targetLevel - Target building level (from config)
 * @returns {number} Number of catapults needed for ONE level reduction
 */
function barb_calculateCatapultsNeeded(buildingType, currentLevel, targetLevel) {
	if (currentLevel <= targetLevel) return 0;

	// Get base catapults for current level
	const baseCata = CATA_PER_BUILDING_LEVEL[currentLevel] || (currentLevel * 3);

	// Apply safety margin
	const cataNeeded = Math.ceil(baseCata * SZEM4_BARB.OPTIONS.safetyMargin);

	debug('barb_calculateCatapultsNeeded', `${buildingType} ${currentLevel} -> ${targetLevel}: need ${cataNeeded} cata (base: ${baseCata})`);
	return Math.max(cataNeeded, 1);
}

/**
 * Update barb_intel storage with building data from report
 * @param {string} coord - Village coordinate "xxx|yyy"
 * @param {object} spyLevels - Building levels from report
 * @param {number} reportDate - Report timestamp
 * @param {number} villageId - Village ID (optional)
 */
function barb_updateIntel(coord, spyLevels, reportDate, villageId) {
	try {
		// Calculate distance from current village (if fromVillage is set) or first player village
		let distance = 0;
		const fromVill = SZEM4_BARB.OPTIONS.fromVillage || Object.keys(KTID)[0];
		if (fromVill) {
			const [sx, sy] = fromVill.split('|').map(Number);
			const [tx, ty] = coord.split('|').map(Number);
			distance = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
		}

		// Preserve existing villageId if not provided in this update
		const existingVillageId = SZEM4_BARB.INTEL[coord] ? SZEM4_BARB.INTEL[coord].villageId : null;

		SZEM4_BARB.INTEL[coord] = {
			coordinate: coord,
			distance: Math.round(distance * 100) / 100,
			main: spyLevels.main || 0,
			wall: spyLevels.wall || 0,
			barracks: spyLevels.barracks || 0,
			stable: spyLevels.stable || 0,
			garage: spyLevels.garage || 0,
			market: spyLevels.market || 0,
			smith: spyLevels.smith || 0,
			reportAge: reportDate,
			lastUpdated: Date.now(),
			attackSent: SZEM4_BARB.INTEL[coord] ? SZEM4_BARB.INTEL[coord].attackSent : null,
			villageId: villageId || existingVillageId || null
		};

		// Refresh UI table if visible
		if (document.getElementById('barb_intel_table')) {
			barb_rebuildTable();
		}

		debug('BARB', `Intel updated for ${coord}: wall=${spyLevels.wall}, barracks=${spyLevels.barracks}`);
	} catch(e) {
		debug('barb_updateIntel', 'Error: ' + e);
	}
}

/**
 * Check if a village needs destruction based on config
 * @param {object} intel - Village intel object
 * @returns {object|null} - Attack plan or null if no action needed
 */
function barb_checkVillageNeeds(intel) {
	const config = SZEM4_BARB.CONFIG;
	const plan = {
		coord: intel.coordinate,
		distance: intel.distance,
		rams: 0,
		catapults: 0,
		catapultTarget: null,
		buildings: []
	};

	// Check wall first
	if (intel.wall > config.maxWall) {
		plan.rams = barb_calculateRamsNeeded(intel.wall, config.maxWall);
		plan.buildings.push({ type: 'wall', current: intel.wall, target: config.maxWall });
	}

	// Check buildings in priority order - only one catapult target per attack
	const buildingPriority = ['barracks', 'stable', 'garage', 'main', 'smith', 'market'];
	for (const building of buildingPriority) {
		const maxKey = 'max' + building.charAt(0).toUpperCase() + building.slice(1);
		const currentLevel = intel[building] || 0;
		const maxLevel = config[maxKey];

		if (currentLevel > maxLevel && !plan.catapultTarget) {
			plan.catapults = barb_calculateCatapultsNeeded(building, currentLevel, maxLevel);
			plan.catapultTarget = building;
			plan.buildings.push({ type: building, current: currentLevel, target: maxLevel });
		}
	}

	// Return plan only if there's something to do
	if (plan.rams > 0 || plan.catapults > 0) {
		return plan;
	}
	return null;
}

/**
 * Get list of all villages needing action
 */
function barb_getTargetList() {
	const targets = [];
	const maxDist = SZEM4_BARB.OPTIONS.maxDistance;

	for (const coord in SZEM4_BARB.INTEL) {
		const intel = SZEM4_BARB.INTEL[coord];
		if (intel.distance > maxDist) continue;

		const plan = barb_checkVillageNeeds(intel);
		if (plan) {
			targets.push(plan);
		}
	}

	// Sort by distance (closest first)
	targets.sort((a, b) => a.distance - b.distance);
	return targets;
}

/**
 * Rebuild the intel table UI
 */
function barb_rebuildTable() {
	const table = document.getElementById('barb_intel_table');
	if (!table) return;

	const tbody = table.querySelector('tbody');
	const config = SZEM4_BARB.CONFIG;

	// Clear existing rows (keep header)
	while (tbody.rows.length > 1) {
		tbody.deleteRow(1);
	}

	// Add rows for each intel entry
	const sortedIntel = Object.values(SZEM4_BARB.INTEL).sort((a, b) => a.distance - b.distance);

	for (const intel of sortedIntel) {
		if (intel.distance > SZEM4_BARB.OPTIONS.maxDistance) continue;

		const row = tbody.insertRow();

		// Check if attack is in progress for this village
		const isInQueue = SZEM4_BARB.QUEUE.some(q => q.coord === intel.coordinate);
		const hasRecentAttack = intel.attackSent && (Date.now() - intel.attackSent) < 3600000; // Within 1 hour

		// Determine row highlighting
		let rowStyle = '';
		if (hasRecentAttack || isInQueue) {
			rowStyle = 'background-color: #bbdefb;'; // Light blue for attack in progress
		} else if (intel.wall >= 3) {
			rowStyle = 'background-color: #ff6b6b;'; // RED for wall >= 3
		} else if (intel.barracks > 1) {
			rowStyle = 'background-color: #ffd93d;'; // YELLOW for barracks > 1
		}
		row.style.cssText = rowStyle;

		// Coordinate (clickable link to village info if ID available, otherwise map)
		const coordCell = row.insertCell();
		coordCell.style.color = '#000';
		const [cx, cy] = intel.coordinate.split('|');
		let coordUrl, coordStyle;
		if (intel.villageId) {
			// Village info URL with ID
			coordUrl = `${BASE_URL}game.php?village&screen=info_village&id=${intel.villageId}#${cx};${cy}`;
			coordStyle = 'color: #8B4513; font-weight: bold; text-decoration: underline;'; // Brown for village info
		} else {
			// Map URL as fallback
			coordUrl = `${BASE_URL}game.php?screen=map&x=${cx}&y=${cy}`;
			coordStyle = 'color: #0066cc; text-decoration: underline;'; // Blue for map
		}
		coordCell.innerHTML = `<a href="${coordUrl}" target="_blank" style="${coordStyle}">${intel.coordinate}</a>`;

		// Distance
		const distCell = row.insertCell();
		distCell.style.color = '#000';
		distCell.textContent = intel.distance.toFixed(1);

		// Building levels with highlighting for values above config
		const buildingCells = ['main', 'wall', 'barracks', 'stable', 'garage', 'market', 'smith'];
		for (const building of buildingCells) {
			const cell = row.insertCell();
			const level = intel[building] || 0;
			const maxKey = 'max' + building.charAt(0).toUpperCase() + building.slice(1);
			const maxLevel = config[maxKey];

			cell.textContent = level;
			cell.style.textAlign = 'center';
			if (level > maxLevel) {
				cell.style.cssText = 'font-weight: bold; color: #c0392b; text-align: center;';
			} else {
				cell.style.color = '#000';
			}
		}

		// Report age
		const ageCell = row.insertCell();
		ageCell.style.color = '#000';
		const ageMinutes = Math.round((Date.now() - intel.reportAge) / 60000);
		if (ageMinutes < 60) {
			ageCell.textContent = ageMinutes + ' min';
		} else if (ageMinutes < 1440) {
			ageCell.textContent = Math.round(ageMinutes / 60) + ' hr';
		} else {
			ageCell.textContent = Math.round(ageMinutes / 1440) + ' day';
		}

		// Status column - show attack status
		const statusCell = row.insertCell();
		statusCell.style.textAlign = 'center';
		if (isInQueue) {
			statusCell.innerHTML = '<span style="color: #2196F3; font-weight: bold;" title="Attack queued">[Q] Queued</span>';
		} else if (hasRecentAttack) {
			const attackAge = Math.round((Date.now() - intel.attackSent) / 60000);
			statusCell.innerHTML = `<span style="color: #2196F3; font-weight: bold;" title="Attack sent ${attackAge}m ago">[ATK] Sent ${attackAge}m</span>`;
		} else {
			const plan = barb_checkVillageNeeds(intel);
			if (plan) {
				statusCell.innerHTML = '<span style="color: #e74c3c;" title="Needs destruction">[!] Needs work</span>';
			} else {
				statusCell.innerHTML = '<span style="color: #27ae60;" title="At target levels">[OK]</span>';
			}
		}

		// Action buttons - disable if already in queue or recently attacked
		const actionCell = row.insertCell();
		const disableAttack = isInQueue || hasRecentAttack;
		actionCell.innerHTML = `
			<button onclick="barb_attackNow('${intel.coordinate}')" class="btn btn-default" style="padding: 2px 6px; background-color: ${disableAttack ? '#999' : '#e74c3c'}; color: white; font-size: 11px;" ${disableAttack ? 'disabled title="Attack already sent/queued"' : ''}>Attack</button>
			<button onclick="barb_queueSingleAttack('${intel.coordinate}')" class="btn btn-default" style="padding: 2px 6px; font-size: 11px;" ${isInQueue ? 'disabled title="Already in queue"' : ''}>+Q</button>
			<button onclick="barb_removeIntel('${intel.coordinate}')" class="btn btn-default" style="padding: 2px 6px; font-size: 11px;">X</button>`;
	}

	// Update stats
	const statsEl = document.getElementById('barb_stats');
	if (statsEl) {
		const targets = barb_getTargetList();
		const inQueue = SZEM4_BARB.QUEUE.length;
		const recentAttacks = Object.values(SZEM4_BARB.INTEL).filter(i => i.attackSent && (Date.now() - i.attackSent) < 3600000).length;
		statsEl.innerHTML = `Intel: ${Object.keys(SZEM4_BARB.INTEL).length} | Need work: ${targets.length} | In queue: ${inQueue} | Recently attacked: ${recentAttacks} | Total sent: ${SZEM4_BARB.STATS.attacksSent}`;
	}

	// Update motor status
	const motorStatusEl = document.getElementById('barb_motor_status');
	if (motorStatusEl) {
		if (BARB_PAUSE) {
			motorStatusEl.innerHTML = '<span style="color: #e74c3c;">Paused</span>';
		} else if (BARB_LEPES === 0) {
			motorStatusEl.innerHTML = '<span style="color: #27ae60;">Ready</span>';
		} else {
			motorStatusEl.innerHTML = `<span style="color: #2196F3;">Working (step ${BARB_LEPES})</span>`;
		}
	}
}

/**
 * Queue a single attack for a village
 */
function barb_queueSingleAttack(coord) {
	const intel = SZEM4_BARB.INTEL[coord];
	if (!intel) {
		naplo('BARB', `No intel for ${coord}`);
		return;
	}

	const plan = barb_checkVillageNeeds(intel);
	if (plan) {
		SZEM4_BARB.QUEUE.push(plan);
		naplo('BARB', `Queued attack on ${coord}: ${plan.rams} rams, ${plan.catapults} catapults → ${plan.catapultTarget || 'none'}`);
	} else {
		naplo('BARB', `${coord} doesn't need action based on config`);
	}
}

/**
 * Attack a village immediately (skip queue)
 */
function barb_attackNow(coord) {
	const intel = SZEM4_BARB.INTEL[coord];
	if (!intel) {
		naplo('BARB', `No intel for ${coord}`);
		return;
	}

	const plan = barb_checkVillageNeeds(intel);
	if (plan) {
		// Add to FRONT of queue for immediate processing
		SZEM4_BARB.QUEUE.unshift(plan);
		barb_updateQueueDisplay();
		naplo('BARB', `Immediate attack on ${coord}: ${plan.rams} rams, ${plan.catapults} catapults → ${plan.catapultTarget || 'none'}`);

		// Reset state machine to process immediately
		BARB_LEPES = 0;
		BARB_HIBA = 0;

		// Trigger motor immediately
		szem4_barb_motor();
	} else {
		naplo('BARB', `${coord} doesn't need action based on config`);
	}
}

/**
 * Queue all villages needing action
 */
function barb_queueAllAttacks() {
	SZEM4_BARB.QUEUE = barb_getTargetList();
	naplo('BARB', `Queued ${SZEM4_BARB.QUEUE.length} attacks`);
	barb_updateQueueDisplay();
}

/**
 * Clear attack queue
 */
function barb_clearQueue() {
	SZEM4_BARB.QUEUE = [];
	barb_updateQueueDisplay();
	naplo('BARB', 'Attack queue cleared');
}

/**
 * Update queue display
 */
function barb_updateQueueDisplay() {
	const el = document.getElementById('barb_queue_count');
	if (el) {
		el.textContent = SZEM4_BARB.QUEUE.length;
	}
}

/**
 * Remove intel for a village
 */
function barb_removeIntel(coord) {
	delete SZEM4_BARB.INTEL[coord];
	barb_rebuildTable();
	naplo('BARB', `Removed intel for ${coord}`);
}

/**
 * Save BARB config from UI
 */
function barb_saveConfig() {
	const form = document.getElementById('barb_config_form');
	if (!form) return;

	SZEM4_BARB.CONFIG.maxMain = parseInt(form.maxMain.value, 10);
	SZEM4_BARB.CONFIG.maxWall = parseInt(form.maxWall.value, 10);
	SZEM4_BARB.CONFIG.maxBarracks = parseInt(form.maxBarracks.value, 10);
	SZEM4_BARB.CONFIG.maxStable = parseInt(form.maxStable.value, 10);
	SZEM4_BARB.CONFIG.maxGarage = parseInt(form.maxGarage.value, 10);
	SZEM4_BARB.CONFIG.maxMarket = parseInt(form.maxMarket.value, 10);
	SZEM4_BARB.CONFIG.maxSmith = parseInt(form.maxSmith.value, 10);

	SZEM4_BARB.OPTIONS.maxDistance = parseInt(form.maxDistance.value, 10);
	SZEM4_BARB.OPTIONS.axesToSend = parseInt(form.axesToSend.value, 10);
	SZEM4_BARB.OPTIONS.spyToSend = parseInt(form.spyToSend.value, 10);
	SZEM4_BARB.OPTIONS.fromVillage = form.fromVillage.value;

	naplo('BARB', 'Configuration saved');
	barb_rebuildTable();
}

/**
 * Load BARB config to UI
 */
function barb_loadConfig() {
	const form = document.getElementById('barb_config_form');
	if (!form) return;

	form.maxMain.value = SZEM4_BARB.CONFIG.maxMain;
	form.maxWall.value = SZEM4_BARB.CONFIG.maxWall;
	form.maxBarracks.value = SZEM4_BARB.CONFIG.maxBarracks;
	form.maxStable.value = SZEM4_BARB.CONFIG.maxStable;
	form.maxGarage.value = SZEM4_BARB.CONFIG.maxGarage;
	form.maxMarket.value = SZEM4_BARB.CONFIG.maxMarket;
	form.maxSmith.value = SZEM4_BARB.CONFIG.maxSmith;

	form.maxDistance.value = SZEM4_BARB.OPTIONS.maxDistance;
	form.axesToSend.value = SZEM4_BARB.OPTIONS.axesToSend;
	form.spyToSend.value = SZEM4_BARB.OPTIONS.spyToSend;
	form.fromVillage.value = SZEM4_BARB.OPTIONS.fromVillage || '';

	// Populate fromVillage dropdown with player villages
	const villSelect = form.fromVillage;
	villSelect.innerHTML = '<option value="">Auto (current)</option>';
	for (const coord in KTID) {
		const opt = document.createElement('option');
		opt.value = coord;
		opt.textContent = coord;
		if (SZEM4_BARB.OPTIONS.fromVillage === coord) opt.selected = true;
		villSelect.appendChild(opt);
	}
}

/**
 * Enable/disable BARB system
 */
function barb_toggleEnabled() {
	SZEM4_BARB.ENABLED = !SZEM4_BARB.ENABLED;
	const btn = document.getElementById('barb_enable_btn');
	if (btn) {
		btn.textContent = SZEM4_BARB.ENABLED ? 'Enabled' : 'Disabled';
		btn.style.backgroundColor = SZEM4_BARB.ENABLED ? '#27ae60' : '#e74c3c';
	}
	naplo('BARB', SZEM4_BARB.ENABLED ? 'Intel collection enabled' : 'Intel collection disabled');
}

/**
 * Import existing DOMINFO_FARMS data to barb_intel
 */
function barb_importFromFarms() {
	let imported = 0;
	for (const coord in SZEM4_FARM.DOMINFO_FARMS) {
		const farm = SZEM4_FARM.DOMINFO_FARMS[coord];
		if (farm.buildings && !farm.isJatekos) {
			const reportDate = SZEM4_VIJE.ALL_VIJE_SAVED[coord] || Date.now();
			barb_updateIntel(coord, farm.buildings, reportDate);
			imported++;
		}
	}
	barb_rebuildTable();
	naplo('BARB', `Imported ${imported} villages from farming data`);
}

/**
 * Main motor function for BARB attacks
 */
function szem4_barb_motor() {
	let nexttime = 5000;

	try {
		// Check if paused
		if (BARB_PAUSE) {
			nexttime = 10000;
			worker.postMessage({'id': 'barb', 'time': nexttime});
			return;
		}

		// Check for bot protection
		if (BOT || USER_ACTIVITY) {
			nexttime = 10000;
			worker.postMessage({'id': 'barb', 'time': nexttime});
			return;
		}

		// Wait for Farming motors to finish - MOTOR COORDINATION
		if (!FARM_PAUSE && FARM_LEPES !== 0) {
			barb_log('Waiting for Farm motor to finish...', 'info');
			nexttime = 3000;
			worker.postMessage({'id': 'barb', 'time': nexttime});
			return;
		}
		if (NORBI0N_FARM_LEPES !== 0) {
			barb_log('Waiting for Norbi0N Farm to finish...', 'info');
			nexttime = 3000;
			worker.postMessage({'id': 'barb', 'time': nexttime});
			return;
		}

		// Error handling
		if (BARB_HIBA > 10) {
			BARB_HIBA = 0;
			BARB_GHIBA++;
			if (BARB_GHIBA > 3) {
				if (BARB_GHIBA > 5) {
					naplo('BARB', 'Too many errors, pausing');
					nexttime = 60000;
				}
				if (BARB_REF && !BARB_REF.closed) BARB_REF.close();
			}
			BARB_LEPES = 0;
		}

		// State machine
		switch (BARB_LEPES) {
			case 0: // Check queue and prepare next attack
				if (SZEM4_BARB.QUEUE.length === 0) {
					nexttime = 30000; // Nothing to do, check again in 30s
					break;
				}

				BARB_CURRENT_TARGET = SZEM4_BARB.QUEUE[0];
				barb_log(`Starting attack on ${BARB_CURRENT_TARGET.coord} (${BARB_CURRENT_TARGET.rams} rams, ${BARB_CURRENT_TARGET.catapults} cata → ${BARB_CURRENT_TARGET.catapultTarget || 'none'})`, 'attack');

				// Open rally point
				const fromVill = SZEM4_BARB.OPTIONS.fromVillage || Object.keys(KTID)[0];
				if (!fromVill) {
					barb_log('No source village configured!', 'error');
					naplo('BARB', 'No source village configured');
					nexttime = 60000;
					break;
				}

				barb_log(`Opening rally point from ${fromVill}...`, 'info');
				const villId = KTID[fromVill];
				const url = VILL1ST.replace(/village=[0-9]+/, 'village=' + villId).replace('screen=overview', 'screen=place');
				BARB_REF = windowOpener('barb', url, AZON + '_barb');
				BARB_LEPES = 1;
				nexttime = 2000;
				barb_rebuildTable(); // Update status display
				break;

			case 1: // Fill attack form
				if (!BARB_REF || BARB_REF.closed) {
					barb_log('Rally point window closed unexpectedly', 'warn');
					BARB_LEPES = 0;
					break;
				}

				if (isPageLoaded(BARB_REF, -1, 'screen=place')) {
					BARB_HIBA = 0;
					barb_log('Filling attack form...', 'info');
					const result = barb_fillAttackForm();
					if (result === 'success') {
						barb_log('Attack form filled, confirming...', 'info');
						BARB_LEPES = 2;
						nexttime = 2000;
					} else if (result === 'insufficient') {
						// Not enough troops, skip this target
						barb_log(`Skipping ${BARB_CURRENT_TARGET.coord} - insufficient troops`, 'warn');
						naplo('BARB', `Skipping ${BARB_CURRENT_TARGET.coord} - insufficient troops`);
						SZEM4_BARB.QUEUE.shift();
						barb_updateQueueDisplay();
						barb_rebuildTable();
						BARB_LEPES = 0;
						nexttime = 1000;
					} else {
						BARB_HIBA++;
					}
				} else {
					BARB_HIBA++;
				}
				break;

			case 2: // Confirm attack and select catapult target
				if (!BARB_REF || BARB_REF.closed) {
					barb_log('Confirmation window closed unexpectedly', 'warn');
					BARB_LEPES = 0;
					break;
				}

				if (isPageLoaded(BARB_REF, -1, 'try=confirm')) {
					BARB_HIBA = 0;

					// Check for bot protection
					if (BARB_REF.document.getElementById('botprotection_quest') ||
						BARB_REF.document.getElementById('bot_check')) {
						barb_log('Bot protection detected! Pausing...', 'error');
						naplo('BARB', 'Bot protection detected!');
						BotvedelemBe();
						BARB_LEPES = 0;
						nexttime = 10000;
						break;
					}

					// Select catapult target if needed
					if (BARB_CURRENT_TARGET.catapultTarget) {
						barb_log(`Selecting catapult target: ${BARB_CURRENT_TARGET.catapultTarget}`, 'info');
						barb_selectCatapultTarget();
					}

					// Confirm attack
					const confirmBtn = BARB_REF.document.getElementById('troop_confirm_submit');
					if (confirmBtn) {
						confirmBtn.click();

						// Update stats
						SZEM4_BARB.STATS.attacksSent++;
						SZEM4_BARB.STATS.lastAttack = Date.now();
						SZEM4_BARB.INTEL[BARB_CURRENT_TARGET.coord].attackSent = Date.now();

						barb_log(`Attack #${SZEM4_BARB.STATS.attacksSent} sent to ${BARB_CURRENT_TARGET.coord}!`, 'success');
						naplo('BARB', `Attack sent to ${BARB_CURRENT_TARGET.coord}`);
						playSound('farmolas_1', 'mp3');

						// Remove from queue
						SZEM4_BARB.QUEUE.shift();
						barb_updateQueueDisplay();
						barb_rebuildTable();

						BARB_LEPES = 0;
						// Random delay 1000-1500ms
						nexttime = 1000 + Math.floor(Math.random() * 500);
					} else {
						barb_log('Confirm button not found, retrying...', 'warn');
						BARB_HIBA++;
					}
				} else {
					BARB_HIBA++;
				}
				break;

			default:
				BARB_LEPES = 0;
		}
	} catch(e) {
		debug('szem4_barb_motor', 'Error: ' + e);
		BARB_LEPES = 0;
	}

	// Add randomization to timing
	const inga = 100 / ((Math.random() * 40) + 80);
	nexttime = Math.round(nexttime * inga);

	worker.postMessage({'id': 'barb', 'time': nexttime});
}

/**
 * Fill the attack form on rally point
 * @returns {string} 'success', 'insufficient', or 'error'
 */
function barb_fillAttackForm() {
	try {
		const doc = BARB_REF.document;
		const form = doc.forms['units'] || doc.getElementById('command-data-form');
		if (!form) {
			debug('barb_fillAttackForm', 'Form not found');
			return 'error';
		}

		const target = BARB_CURRENT_TARGET;
		debug('barb_fillAttackForm', `Starting attack on ${target.coord}: rams=${target.rams}, cata=${target.catapults}`);

		// Check available troops
		const availableRam = barb_getAvailableTroops('ram');
		const availableCata = barb_getAvailableTroops('catapult');
		const availableAxe = barb_getAvailableTroops('axe');
		const availableSpy = barb_getAvailableTroops('spy');

		debug('barb_fillAttackForm', `Available: ram=${availableRam}, cata=${availableCata}, axe=${availableAxe}, spy=${availableSpy}`);

		// Check if we have enough troops
		if (target.rams > 0 && availableRam < target.rams) {
			debug('barb_fillAttackForm', `Insufficient rams: need ${target.rams}, have ${availableRam}`);
			return 'insufficient';
		}
		if (target.catapults > 0 && availableCata < target.catapults) {
			debug('barb_fillAttackForm', `Insufficient catapults: need ${target.catapults}, have ${availableCata}`);
			return 'insufficient';
		}
		if (availableAxe < SZEM4_BARB.OPTIONS.axesToSend) {
			debug('barb_fillAttackForm', `Insufficient axes: need ${SZEM4_BARB.OPTIONS.axesToSend}, have ${availableAxe}`);
			return 'insufficient';
		}

		// Fill coordinates
		const [x, y] = target.coord.split('|');
		form.x.value = x;
		form.y.value = y;
		debug('barb_fillAttackForm', `Coordinates set: ${x}|${y}`);

		// Fill troops using getElementById (more reliable than form[name])
		const setTroopValue = (unitType, value) => {
			const input = doc.getElementById('unit_input_' + unitType);
			if (input) {
				input.value = value;
				debug('barb_fillAttackForm', `Set ${unitType} = ${value}`);
				return true;
			}
			debug('barb_fillAttackForm', `Input not found for ${unitType}`);
			return false;
		};

		// Set siege units
		if (target.rams > 0) setTroopValue('ram', target.rams);
		if (target.catapults > 0) setTroopValue('catapult', target.catapults);

		// Set escort troops
		setTroopValue('axe', SZEM4_BARB.OPTIONS.axesToSend);

		// Set spy if available
		if (availableSpy >= SZEM4_BARB.OPTIONS.spyToSend) {
			setTroopValue('spy', SZEM4_BARB.OPTIONS.spyToSend);
		}

		// Clear other troops to avoid accidental sends
		const otherTroops = ['spear', 'sword', 'archer', 'light', 'marcher', 'heavy', 'snob'];
		for (const troop of otherTroops) {
			const input = doc.getElementById('unit_input_' + troop);
			if (input) input.value = 0;
		}

		// Click attack button
		const attackBtn = form.attack || doc.getElementById('target_attack');
		if (attackBtn) {
			debug('barb_fillAttackForm', 'Clicking attack button');
			attackBtn.click();
			return 'success';
		}

		debug('barb_fillAttackForm', 'Attack button not found');
		return 'error';
	} catch(e) {
		debug('barb_fillAttackForm', 'Error: ' + e);
		return 'error';
	}
}

/**
 * Get available troop count from rally point form
 * @param {string} unitType - Unit type (ram, catapult, axe, spy, etc.)
 * @returns {number} Available count
 */
function barb_getAvailableTroops(unitType) {
	try {
		const doc = BARB_REF.document;
		const input = doc.getElementById('unit_input_' + unitType);
		if (!input) {
			debug('barb_getAvailableTroops', `Input not found for ${unitType}`);
			return 0;
		}

		// Use data-all-count attribute - this is the most reliable source
		const dataCount = input.getAttribute('data-all-count');
		if (dataCount !== null) {
			const count = parseInt(dataCount, 10);
			debug('barb_getAvailableTroops', `${unitType}: ${count} (from data-all-count)`);
			return count;
		}

		// Fallback: try to read from the anchor tag like "(70)"
		const anchor = doc.getElementById('units_entry_all_' + unitType);
		if (anchor) {
			const match = anchor.textContent.match(/\d+/);
			if (match) {
				const count = parseInt(match[0], 10);
				debug('barb_getAvailableTroops', `${unitType}: ${count} (from anchor text)`);
				return count;
			}
		}

		debug('barb_getAvailableTroops', `${unitType}: 0 (no source found)`);
		return 0;
	} catch(e) {
		debug('barb_getAvailableTroops', `Error for ${unitType}: ${e.message}`);
		return 0;
	}
}

/**
 * Select catapult target on confirmation page
 */
function barb_selectCatapultTarget() {
	try {
		const target = BARB_CURRENT_TARGET.catapultTarget;
		if (!target) return;

		debug('barb_selectCatapultTarget', `Trying to select catapult target: ${target}`);

		// Get i18n building name from VIJE settings if available
		const i18nTarget = SZEM4_VIJE.i18ns[target] || target;
		debug('barb_selectCatapultTarget', `i18n target name: ${i18nTarget}`);

		// Find catapult target select element
		const selects = BARB_REF.document.querySelectorAll('select');
		for (const select of selects) {
			// Look for the building dropdown
			if (select.name && (select.name.includes('building') || select.name.includes('catapult') || select.name.includes('target'))) {
				debug('barb_selectCatapultTarget', `Found select: ${select.name}, options: ${select.options.length}`);
				// Try to select the target building
				for (const option of select.options) {
					const optText = option.textContent.toLowerCase().trim();
					const optVal = option.value.toLowerCase();
					// Match by building ID, i18n name, or text content
					if (optVal.includes(target.toLowerCase()) ||
						optText.includes(target.toLowerCase()) ||
						optText.includes(i18nTarget.toLowerCase())) {
						select.value = option.value;
						select.dispatchEvent(new Event('change', { bubbles: true }));
						debug('BARB', `Selected catapult target: ${target} (option: ${option.textContent})`);
						return;
					}
				}
			}
		}

		// Alternative: look for specific ID patterns
		const catSelect = BARB_REF.document.querySelector('#target_building, select[name="building"], select[name="catapult_target"]');
		if (catSelect) {
			debug('barb_selectCatapultTarget', `Found alternative select with ${catSelect.options.length} options`);
			for (const option of catSelect.options) {
				const optText = option.textContent.toLowerCase().trim();
				if (optText.includes(target.toLowerCase()) || optText.includes(i18nTarget.toLowerCase())) {
					catSelect.value = option.value;
					catSelect.dispatchEvent(new Event('change', { bubbles: true }));
					debug('BARB', `Selected catapult target via alternative: ${target}`);
					return;
				}
			}
		}

		debug('barb_selectCatapultTarget', `Could not find option for target: ${target}`);
	} catch(e) {
		debug('barb_selectCatapultTarget', 'Error: ' + e);
	}
}

/**
 * Save BARB data to localStorage
 */
function barb_save() {
	localStorage.setItem(AZON + '_barb', JSON.stringify(SZEM4_BARB));
	debug('BARB', 'Data saved');
}

/**
 * Load BARB data from localStorage
 */
function barb_load() {
	try {
		const saved = localStorage.getItem(AZON + '_barb');
		if (saved) {
			const data = JSON.parse(saved);
			SZEM4_BARB = Object.assign({}, SZEM4_BARB, data);
		}
		barb_loadConfig();
		barb_rebuildTable();
	} catch(e) {
		debug('barb_load', 'Error: ' + e);
	}
}

// Initialize BARB motor
barb_load();
szem4_barb_motor();

// Add to save system
const orig_barb_szem4_ADAT_saveNow = szem4_ADAT_saveNow;
szem4_ADAT_saveNow = function(tipus) {
	if (tipus === 'barb') {
		barb_save();
		return;
	}
	orig_barb_szem4_ADAT_saveNow(tipus);
};

// UI for BARB module
// Building icon URL helper for BARB
const BARB_BUILDING_ICONS = {
	main: 'https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/main1.png',
	wall: 'https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/wall1.png',
	barracks: 'https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/barracks1.png',
	stable: 'https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/stable1.png',
	garage: 'https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/garage1.png',
	market: 'https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/market1.png',
	smith: 'https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/smith1.png'
};

function barb_getBuildingIcon(building, size = 18) {
	const url = BARB_BUILDING_ICONS[building] || '';
	return url ? `<img src="${url}" style="width:${size}px; height:${size}px; vertical-align:middle;" title="${building}">` : '';
}

ujkieg('barb', 'Barb Control', `<tr><td style="color: black;">
	<h2 align="center" style="color: black;">Barbarian Village Control System</h2>
	<p align="center" style="color: #666;">Automatically destroy buildings in barbarian villages to configured max levels</p>

	<!-- Status Section -->
	<div style="background: #e8d4a0; border: 2px solid #7d510f; border-radius: 8px; padding: 15px; margin-bottom: 15px; color: black;">
		<h3 style="margin-top: 0; color: black;">Status</h3>
		<table class="vis" style="width: 100%; color: black;">
			<tr>
				<td style="width: 150px;"><b>Intel Collection:</b></td>
				<td><button id="barb_enable_btn" onclick="barb_toggleEnabled()" class="btn" style="background-color: #e74c3c; color: white;">Disabled</button></td>
			</tr>
			<tr>
				<td><b>Motor Status:</b></td>
				<td id="barb_motor_status">Idle</td>
			</tr>
			<tr>
				<td><b>Attack Queue:</b></td>
				<td><span id="barb_queue_count">0</span> attacks queued</td>
			</tr>
			<tr>
				<td><b>Statistics:</b></td>
				<td id="barb_stats">Loading...</td>
			</tr>
		</table>
		<p align="center" style="margin-top: 10px;">
			<button onclick="barb_queueAllAttacks()" class="btn">Queue All Attacks</button>
			<button onclick="barb_clearQueue()" class="btn">Clear Queue</button>
			<button onclick="barb_importFromFarms()" class="btn">Import from Farms</button>
		</p>
	</div>

	<!-- Configuration Section (Collapsible) -->
	<div style="background: #f5f5f5; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 15px; color: black;">
		<h3 onclick="barb_toggleConfig()" style="margin: 0; padding: 15px; cursor: pointer; color: black; user-select: none;">
			<span id="barb_config_arrow" style="display: inline-block; transition: transform 0.3s;">&#9660;</span> Configuration
			<span style="font-size: 11px; font-weight: normal; color: #666; margin-left: 10px;">(click to collapse/expand)</span>
		</h3>
		<div id="barb_config_content" style="padding: 0 15px 15px 15px;">
			<form id="barb_config_form">
				<table class="vis" style="margin: auto; color: black;">
					<tr><th colspan="4">Max Allowed Building Levels (destroy if above)</th></tr>
					<tr>
						<td><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/main1.png" style="width:20px; height:20px; vertical-align:middle;"> Main:</td>
						<td><input type="number" name="maxMain" min="0" max="30" value="1" style="width: 50px;"></td>
						<td><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/wall1.png" style="width:20px; height:20px; vertical-align:middle;"> Wall:</td>
						<td><input type="number" name="maxWall" min="0" max="20" value="0" style="width: 50px;"></td>
					</tr>
					<tr>
						<td><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/barracks1.png" style="width:20px; height:20px; vertical-align:middle;"> Barracks:</td>
						<td><input type="number" name="maxBarracks" min="0" max="25" value="0" style="width: 50px;"></td>
						<td><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/stable1.png" style="width:20px; height:20px; vertical-align:middle;"> Stable:</td>
						<td><input type="number" name="maxStable" min="0" max="20" value="0" style="width: 50px;"></td>
					</tr>
					<tr>
						<td><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/garage1.png" style="width:20px; height:20px; vertical-align:middle;"> Workshop:</td>
						<td><input type="number" name="maxGarage" min="0" max="15" value="0" style="width: 50px;"></td>
						<td><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/smith1.png" style="width:20px; height:20px; vertical-align:middle;"> Smithy:</td>
						<td><input type="number" name="maxSmith" min="0" max="20" value="20" style="width: 50px;"></td>
					</tr>
					<tr>
						<td><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/market1.png" style="width:20px; height:20px; vertical-align:middle;"> Market:</td>
						<td><input type="number" name="maxMarket" min="0" max="25" value="20" style="width: 50px;"></td>
						<td></td><td></td>
					</tr>
					<tr><th colspan="4">Attack Options</th></tr>
					<tr>
						<td>Max Distance:</td>
						<td><input type="number" name="maxDistance" min="1" max="100" value="30" style="width: 50px;"></td>
						<td>Axes to send:</td>
						<td><input type="number" name="axesToSend" min="0" max="100" value="10" style="width: 50px;"></td>
					</tr>
					<tr>
						<td>Spy to send:</td>
						<td><input type="number" name="spyToSend" min="0" max="10" value="1" style="width: 50px;"></td>
						<td>From Village:</td>
						<td><select name="fromVillage" style="width: 100px;"><option value="">Auto</option></select></td>
					</tr>
				</table>
				<p align="center" style="margin-top: 10px;">
					<button type="button" onclick="barb_saveConfig()" class="btn">Save Config</button>
					<button type="button" onclick="barb_save()" class="btn">Save All Data</button>
				</p>
			</form>
		</div>
	</div>

	<!-- Intel Table -->
	<h3 style="color: black;">Village Intel</h3>
	<div style="max-height: 400px; overflow-y: auto;">
		<table class="vis" id="barb_intel_table" style="width: 100%; color: black;">
			<tbody>
				<tr>
					<th>Coord</th>
					<th>Dist</th>
					<th title="Main Building"><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/main1.png" style="width:18px; height:18px;"></th>
					<th title="Wall"><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/wall1.png" style="width:18px; height:18px;"></th>
					<th title="Barracks"><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/barracks1.png" style="width:18px; height:18px;"></th>
					<th title="Stable"><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/stable1.png" style="width:18px; height:18px;"></th>
					<th title="Workshop"><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/garage1.png" style="width:18px; height:18px;"></th>
					<th title="Market"><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/market1.png" style="width:18px; height:18px;"></th>
					<th title="Smithy"><img src="https://dshu.innogamescdn.com/asset/88651122/graphic/buildings/mid/smith1.png" style="width:18px; height:18px;"></th>
					<th>Age</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</tbody>
		</table>
	</div>

	<!-- Legend -->
	<div style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px; color: black;">
		<b>Legend:</b>
		<span style="background: #ffd93d; padding: 2px 8px; margin-left: 10px; color: black;">Yellow = Barracks > 1</span>
		<span style="background: #ff6b6b; padding: 2px 8px; margin-left: 10px; color: black;">Red = Wall >= 3</span>
		<span style="color: #c0392b; font-weight: bold; margin-left: 10px;">Bold red = Above max</span>
		<span style="color: #2196F3; font-weight: bold; margin-left: 10px;">Blue = Attack incoming</span>
	</div>

	<!-- Activity Log Section (at bottom) -->
	<div style="background: #f5f5f5; border: 1px solid #ccc; border-radius: 8px; padding: 15px; margin-top: 15px; color: black;">
		<h3 style="margin-top: 0; color: black;">Activity Log</h3>
		<div id="barb_log" style="background: #1a1a1a; color: #00ff00; font-family: monospace; font-size: 11px; padding: 10px; height: 180px; overflow-y: auto; border: 1px solid #7d510f; border-radius: 4px;">
			<div style="color: #888;">Waiting for activity...</div>
		</div>
	</div>
</td></tr>`);

// BARB Log Function
function barb_log(message, type = 'info') {
	const logDiv = document.getElementById('barb_log');
	if (!logDiv) return;

	const timestamp = new Date().toLocaleTimeString();
	const colors = {
		'info': '#00ff00',
		'warn': '#ffff00',
		'error': '#ff4444',
		'success': '#44ff44',
		'attack': '#2196F3'
	};
	const color = colors[type] || colors.info;

	const entry = document.createElement('div');
	entry.style.color = color;
	entry.innerHTML = `[${timestamp}] ${message}`;

	// Remove "waiting" message if present
	const waiting = logDiv.querySelector('div[style*="color: #888"]');
	if (waiting) waiting.remove();

	logDiv.appendChild(entry);
	logDiv.scrollTop = logDiv.scrollHeight;

	// Keep only last 40 entries
	while (logDiv.children.length > 40) {
		logDiv.removeChild(logDiv.firstChild);
	}
}

// Toggle configuration panel visibility
function barb_toggleConfig() {
	const content = document.getElementById('barb_config_content');
	const arrow = document.getElementById('barb_config_arrow');
	if (!content || !arrow) return;

	if (content.style.display === 'none') {
		content.style.display = 'block';
		arrow.style.transform = 'rotate(0deg)';
	} else {
		content.style.display = 'none';
		arrow.style.transform = 'rotate(-90deg)';
	}
}

// Initialize UI after DOM is ready
setTimeout(() => {
	barb_loadConfig();
	barb_rebuildTable();
	barb_updateQueueDisplay();
	if (SZEM4_BARB.ENABLED) {
		const btn = document.getElementById('barb_enable_btn');
		if (btn) {
			btn.textContent = 'Enabled';
			btn.style.backgroundColor = '#27ae60';
		}
	}
}, 500);

/*-----------------ÉPÍTŐ--------------------*/
function szem4_EPITO_perccsokkento(){try{
	var hely=document.getElementById("epit").getElementsByTagName("table")[1].rows;
	var patt=/[0-9]+\:[0-9]+/g;
	for (var i=1;i<hely.length;i++) {
		let currentCell = hely[i].cells[3];
		if (currentCell.textContent.search(patt)>-1) {
			let time = currentCell.textContent.match(patt)[0];
			time = time.split(':').map(a => parseInt(a,10));
			time = time[0] * 60 + time[1];
			time--;
			currentCell.textContent = currentCell.textContent.replace(patt, writeAllBuildTime(time, true));
		}
	}
}catch(e){debug("Építő_pcsökk",e); setTimeout("szem4_EPITO_perccsokkento()",60000);}}
function writeAllBuildTime(minutes, isDateOnly=false) {
	let sixty = 60;
	let hours = Math.floor(minutes / sixty);
	let mins = minutes % sixty;
	let toDate = hours.toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0');
	if (isDateOnly) {
		return toDate;
	}
	return '<span class="writeOutDate">Hátralévő építési idő: ' + toDate + '</span>';
}

function szem4_EPITO_getlista(){try{
	var ret='<select>';
	var Z=document.getElementById("epit").getElementsByTagName("table")[0].rows;
	for (var i=1;i<Z.length;i++) {
		ret+='<option value="'+Z[i].cells[0].textContent+'">'+Z[i].cells[0].textContent+'</option> ';
	}
	ret+='</select>'; 
	return ret;
}catch(e){debug("Építő",e);}}

function szem4_EPITO_csopDelete(ezt){try{
	var name=ezt.innerHTML;
	if (!confirm("Biztos kitörlöd a "+name+" nevű csoportot?\nA csoportot használó faluk az Alapértelmezett csoportba fognak tartozni.")) return;
	sortorol(ezt,"");
	var bodyTable=document.getElementById("epit_lista").rows;
	for (var i=1;i<bodyTable.length;i++) {
		var selectedElement=bodyTable[i].cells[1].getElementsByTagName("select")[0];
		if (selectedElement.value==name) selectedElement.value=document.getElementById("epit").getElementsByTagName("table")[0].rows[1].cells[0].innerHTML;
	}
	bodyTable=document.getElementById("epit_ujfalu_adat").getElementsByTagName("option");
	for (var i=0;i<bodyTable.length;i++) {
		if (bodyTable[i].value==name) {
			document.getElementById("epit_ujfalu_adat").getElementsByTagName("select")[0].remove(i);
			break;
		}
	}
}catch(e){alert2("Hiba:\n"+e);}}

/* Import villages from overview_villages page */
var EPIT_IMPORT_REF = null;

function szem4_EPITO_importFromOverview() {
	try {
		// Open the overview_villages page
		const overviewUrl = VILL1ST.replace(/screen=[^&]+/, 'screen=overview_villages').replace(/&intro.*$/, '');
		EPIT_IMPORT_REF = window.open(overviewUrl, '_blank', 'width=1000,height=600');

		if (!EPIT_IMPORT_REF) {
			alert2('❌ Nem sikerült megnyitni az áttekintő oldalt! / Could not open overview page!\n\nEngedélyezd a popup ablakokat! / Allow popups!');
			return;
		}

		naplo("Építő", "📥 Import: Falu áttekintő megnyitva... / Village overview opened...");

		// Wait for page to load, then parse villages
		let checkCount = 0;
		const maxChecks = 30; // 15 seconds max

		const checkInterval = setInterval(() => {
			checkCount++;
			try {
				if (EPIT_IMPORT_REF.closed) {
					clearInterval(checkInterval);
					debug('szem4_EPITO_importFromOverview', 'Import window was closed by user');
					return;
				}

				// Check if page is loaded
				if (EPIT_IMPORT_REF.document && EPIT_IMPORT_REF.document.readyState === 'complete') {
					const villageRows = EPIT_IMPORT_REF.document.querySelectorAll('#combined_table tbody tr, #production_table tbody tr');

					if (villageRows.length > 0) {
						clearInterval(checkInterval);
						szem4_EPITO_parseImportedVillages(villageRows);
						return;
					}
				}

				if (checkCount >= maxChecks) {
					clearInterval(checkInterval);
					alert2('❌ Időtúllépés! / Timeout!\n\nAz oldal nem töltődött be időben. / Page did not load in time.');
					if (EPIT_IMPORT_REF && !EPIT_IMPORT_REF.closed) EPIT_IMPORT_REF.close();
				}
			} catch(e) {
				// Cross-origin or other error - keep trying
				if (checkCount >= maxChecks) {
					clearInterval(checkInterval);
					debug('szem4_EPITO_importFromOverview', `Import error after ${checkCount} checks: ${e}`);
				}
			}
		}, 500);

	} catch(e) {
		alert2('❌ Import hiba / Import error:\n' + e);
		debug('szem4_EPITO_importFromOverview', e);
	}
}

function szem4_EPITO_parseImportedVillages(rows) {
	try {
		let importedCoords = [];
		let importedCount = 0;

		for (const row of rows) {
			try {
				// Find the village link/span with coordinates
				// Format: "villagename (XXX|YYY) K##"
				const villageCell = row.querySelector('td:first-child');
				if (!villageCell) continue;

				const cellText = villageCell.textContent;
				const coordMatch = cellText.match(/\((\d{1,3}\|\d{1,3})\)/);

				if (coordMatch && coordMatch[1]) {
					importedCoords.push(coordMatch[1]);
					importedCount++;
				}
			} catch(e) {
				// Skip invalid rows
			}
		}

		if (importedCount === 0) {
			alert2('❌ Nem találtam falukat! / No villages found!');
			if (EPIT_IMPORT_REF && !EPIT_IMPORT_REF.closed) EPIT_IMPORT_REF.close();
			return;
		}

		// Close the import window
		if (EPIT_IMPORT_REF && !EPIT_IMPORT_REF.closed) EPIT_IMPORT_REF.close();

		// Put coordinates into input field
		const adat = document.getElementById("epit_ujfalu_adat");
		if (adat) {
			const input = adat.getElementsByTagName("input")[0];
			if (input) {
				input.value = importedCoords.join(' ');
			}
		}

		naplo("Építő", `📥 Import: ${importedCount} falu koordináta beolvasva! / ${importedCount} village coordinates imported!`);
		alert2(`✅ ${importedCount} falu koordináta beolvasva!\n${importedCount} village coordinates imported!\n\nKattints az "Új falu(k)" gombra a hozzáadáshoz!\nClick "Új falu(k)" to add them!`);

		debug('szem4_EPITO_parseImportedVillages', `Imported ${importedCount} villages: ${importedCoords.join(', ')}`);

	} catch(e) {
		alert2('❌ Feldolgozási hiba / Parse error:\n' + e);
		debug('szem4_EPITO_parseImportedVillages', e);
	}
}

function szem4_EPITO_ujFalu() {
	try {
		var adat = document.getElementById("epit_ujfalu_adat");
		var faluCoord = adat.getElementsByTagName("input")[0].value;
		if (faluCoord == "" || faluCoord == null) return;
		faluCoord = faluCoord.match(/[0-9]{1,3}(\|)[0-9]{1,3}/g);
		var Z = document.getElementById("epit_lista");
		var str = "";
		var lista = szem4_EPITO_getlista();
		for (var i = 0; i < faluCoord.length; i++) {
			var vane = false;
			for (var j = 1; j < Z.rows.length; j++) {
				if (Z.rows[j].cells[0].textContent.includes(`(${faluCoord[i]})`)) vane = true;
			} if (vane) { str += "DUP:" + faluCoord[i] + ", "; continue; }
			if (!KTID[faluCoord[i]]) { str += "NL: " + faluCoord[i] + ", "; continue; }

			var ZR = Z.insertRow(-1);
			var ZC = ZR.insertCell(0); ZC.innerHTML = `${ID_TO_INFO[KTID[faluCoord[i]]].name} (${faluCoord[i]})`; ZC.setAttribute("ondblclick", "sortorol(this)");
			ZC = ZR.insertCell(1); ZC.innerHTML = lista; ZC.getElementsByTagName("select")[0].value = adat.getElementsByTagName("select")[0].value;
			ZC = ZR.insertCell(2); 
				ZC.style.fontSize = "x-small"; 
				ZC.style.cursor = "pointer";
				ZC.style.backgroundColor = "#e8f5e9";
				var d = getServerTime(); 
				ZC.setAttribute('data-timestamp', d.getTime());
				ZC.innerHTML = `⏰ ${d.toLocaleString()}`;
				ZC.setAttribute("ondblclick", "szem4_EPITO_forceReturn(this.parentNode)");
				ZC.setAttribute("title", "Dupla klikk: Return MOST! / Double click: Return NOW!");
			ZC = ZR.insertCell(3); ZC.innerHTML = "<i>Feldolgozás alatt...</i>" + ' <a href="' + VILL1ST.replace(/(village=)[0-9]+/g, "village=" + KTID[faluCoord[i]]).replace('screen=overview', 'screen=main') + '" target="_BLANK"><img alt="Nyit" title="Falu megnyitása" src="' + pic("link.png") + '"></a>';; ZC.setAttribute("ondblclick", 'szem4_EPITO_infoCell(this.parentNode,\'alap\',"")');
		}
		if (str != "") alert2("Dupla megadások/nem létező faluk kiszűrve: " + str);
		adat.getElementsByTagName("input")[0].value = "";
		return;
	} catch (e) { alert2("Új falu(k) felvételekori hiba:\n" + e); }
}

function szem4_EPITO_ujCsop(){try{
	var cs_nev=document.getElementById("epit_ujcsopnev").value.replace(/[;\._]/g,"").replace(/( )+/g," ");;
	if (cs_nev=="" || cs_nev==null) return;
	var Z=document.getElementById("epit").getElementsByTagName("table")[0];
	for (var i=1;i<Z.rows.length;i++) {
		if (Z.rows[i].cells[0].textContent==cs_nev) throw "Már létezik ilyen nevű csoport";
	}
	var ZR=Z.insertRow(-1);
	var ZC=ZR.insertCell(0); ZC.innerHTML=cs_nev; ZC.setAttribute("ondblclick","szem4_EPITO_csopDelete(this)");
		ZC=ZR.insertCell(1); ZC.innerHTML=Z.rows[1].cells[1].innerHTML; ZC.getElementsByTagName("input")[0].disabled=false;
	
	var Z=document.getElementById("epit_lista").rows;
	for (var i=1;i<Z.length;i++) {
		var Z2=Z[i].cells[1].getElementsByTagName("select")[0];
		var option=document.createElement("option");
		option.text=cs_nev;
		Z2.add(option);
	}
	Z2=document.getElementById("epit_ujfalu_adat").getElementsByTagName("select")[0];
	option=document.createElement("option");
	option.text=cs_nev;
	Z2.add(option);
	document.getElementById("epit_ujcsopnev").value="";
	return;
}catch(e){alert2("Új csoport felvételekori hiba:\n"+e);}}

function szem4_EPITO_cscheck(alma){try{
	var Z=alma.parentNode.getElementsByTagName("input")[0].value;
	Z=Z.split(";");
	
	var epuletek=new Array("main","barracks","stable","garage","church_f","church","smith","snob","place","statue","market","wood","stone","iron","farm","storage","hide","wall","MINES");
	for (var i=0;i<Z.length;i++) {
		if (epuletek.indexOf(Z[i].match(/[a-zA-Z]+/g)[0])>-1) {} else throw "Nincs ilyen épület: "+Z[i].match(/[a-zA-Z]+/g)[0];
		if (parseInt(Z[i].match(/[0-9]+/g)[0])>30) throw "Túl magas épületszint: "+Z[i];
	}
	alert2("Minden OK");
}catch(e){alert2(`Hibás lista: [${i}]\n ${e}`);}}

function szem4_EPITO_most(objektum){try{
	var d=getServerTime();
	objektum.innerHTML=d.toLocaleString();
	return;
}catch(e){alert2("Hiba lépett fel:\n"+e);}}

function szem4_EPITO_csopToList(csoport){try{
	var Z=document.getElementById("epit").getElementsByTagName("table")[0].rows;
	for (var i=1;i<Z.length;i++) {
		if (Z[i].cells[0].textContent==csoport) return Z[i].cells[1].getElementsByTagName("input")[0].value;
	}
	return ";";
}catch(e){debug("epito_csopToList",e);}}

function szem4_EPITO_Wopen(){try{
	/*Eredmény: faluID, teljes építendő lista, pointer a sorra*/
	var TT=document.getElementById("epit_lista").rows;
	var now=getServerTime().getTime();
	let readyVillages = [];
	let waitingVillages = [];
	
	for (var i=1;i<TT.length;i++) {
		let coord = TT[i].cells[0].textContent.trim().match(/\([0-9]+\|[0-9]+\)$/)[0].replace('(','').replace(')','');
		
		// Use timestamp attribute for reliable comparison
		var returnTimestamp = TT[i].cells[2].getAttribute('data-timestamp');
		if (returnTimestamp) {
			returnTimestamp = parseInt(returnTimestamp, 10);
		} else {
			// Fallback: try to parse text (less reliable)
			var datum = new Date(TT[i].cells[2].textContent);
			returnTimestamp = datum.getTime();
			debug('szem4_EPITO_Wopen', `WARNING: No timestamp attribute for ${coord}, using text parsing (unreliable)`);
		}
		
		if (returnTimestamp < now) {
			var lista=szem4_EPITO_csopToList(TT[i].cells[1].getElementsByTagName("select")[0].value);
			debug('szem4_EPITO_Wopen', `Village ${coord} is READY (Return: ${returnTimestamp}, Now: ${now}, Diff: ${Math.round((now-returnTimestamp)/1000)}s)`);
			return [ KTID[coord], lista, TT[i] ];
		} else {
			let minutesUntil = Math.round((returnTimestamp - now) / 60000);
			waitingVillages.push(`${coord} (${minutesUntil}m)`);
		}
	}
	
	if (waitingVillages.length > 0) {
		debug('szem4_EPITO_Wopen', `No village ready. Waiting: ${waitingVillages.join(', ')}`);
	} else {
		debug('szem4_EPITO_Wopen', 'No villages in builder list');
	}
	
	return [0,";"];
}catch(e){debug("Epito_Wopen",e);}}

function szem4_EPITO_addIdo(sor, perc){try{
	if (perc == "del") {
		document.getElementById("epit_lista").deleteRow(sor.rowIndex);
		debug('szem4_EPITO_addIdo', `Village removed from builder list: ${sor.cells[0].textContent}`);
	} else {
		if (perc === 0) perc = 30;
		if (isNaN(perc)) perc = 5;
		var d=getServerTime();
		// FIX: Should add MINUTES, not set seconds to minutes!
		d.setMinutes(d.getMinutes() + perc);
		// Store timestamp for reliable comparison
		sor.cells[2].setAttribute('data-timestamp', d.getTime());
		sor.cells[2].innerHTML=d.toLocaleString();
		debug('szem4_EPITO_addIdo', `Return time set to ${d.toLocaleString()} [${d.getTime()}] (in ${perc} minutes) for ${sor.cells[0].textContent}`);
	}
}catch(e){debug("epito_addIdo",e); return false;}}

function szem4_EPITO_infoCell(sor,szin,info){try{
	if (szin=="alap") szin="#f4e4bc";
	if (szin=="blue") szin="#44F";
	if (szin=="red") setTimeout('playSound("kritikus_hiba")',2000);
	sor.cells[3].style.backgroundColor=szin;
	let coord = sor.cells[0].textContent.split(' ');
	coord = coord[coord.length-1].replace('(', '').replace(')','');
	sor.cells[3].innerHTML=info+' <a href="'+VILL1ST.replace(/(village=)[0-9]+/g,"village="+KTID[coord]).replace('screen=overview','screen=main')+'" target="_BLANK"><img alt="Nyit" title="Falu megnyitása" src="'+pic("link.png")+'"></a>';
	return;
}catch(e){debug("építő_infoCell",e);}}

function szem4_EPITO_getBuildLink(ref, type) {
	var row = ref.document.getElementById('main_buildrow_' + type);
	if (row.cells.length < 3) return false;
	var patt = new RegExp('main_buildlink_'+type+'_[0-9]+','g');
	var allItem = row.getElementsByTagName("*");
	for (var i=0;i<allItem.length;i++) {
		if (patt.test(allItem[i].id)) {
		return allItem[i];
		}
	}
}

/**
 * Collects quest rewards when resources are needed
 * Works with quest popup dialog
 * @param {Window} ref - Builder window reference
 * @param {string} buildingType - Building that needs resources
 * @param {Object} resNeed - Required resources {wood, stone, iron}
 * @param {HTMLElement} villageRow - Village row in builder table
 * @returns {Promise<boolean>} True if rewards collected and resources now sufficient
 */
async function szem4_EPITO_collectRewards(ref, buildingType, resNeed, villageRow) {
	try {
		debug('szem4_EPITO_collectRewards', `Attempting to collect rewards for ${buildingType}`);
		
		// Step 1: Click quest notification button to open dialog
		const questButton = ref.document.getElementById('new_quest');
		if (!questButton || questButton.style.display === 'none') {
			debug('szem4_EPITO_collectRewards', 'No quest notification available');
			return false;
		}
		
		questButton.click();
		await new Promise(resolve => setTimeout(resolve, 1500));
		
		// Step 2: Find and click Rewards tab in the popup
		const tabs = ref.document.querySelectorAll('.tab-link');
		let rewardsTab = null;
		tabs.forEach(tab => {
			if (tab.textContent.includes('Jutalmak') || tab.textContent.includes('Rewards')) {
				rewardsTab = tab;
			}
		});
		
		if (!rewardsTab) {
			debug('szem4_EPITO_collectRewards', 'Rewards tab not found in dialog');
			// Close dialog
			const closeBtn = ref.document.querySelector('.popup_box_close');
			if (closeBtn) closeBtn.click();
			return false;
		}
		
		rewardsTab.click();
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Step 3: Claim ALL rewards until storage warning
		let claimedCount = 0;
		const maxIterations = 100; // High limit to collect everything
		
		for (let i = 0; i < maxIterations; i++) {
			const claimButton = ref.document.querySelector('#reward-system-rewards .reward-system-claim-button:not([disabled])');
			
			if (!claimButton) {
				debug('szem4_EPITO_collectRewards', `No more rewards available. Total collected: ${claimedCount}`);
				break;
			}
			
			// Check storage warning BEFORE clicking
			const buttonRow = claimButton.closest('tr');
			const warning = buttonRow ? buttonRow.querySelector('.small.warn') : null;
			if (warning && (warning.textContent.includes('túl kevés a hely') || warning.textContent.includes('not enough space'))) {
				debug('szem4_EPITO_collectRewards', `Storage warning detected. Stopping. Collected: ${claimedCount}`);
				break;
			}
			
			claimButton.click();
			claimedCount++;
			
			await new Promise(resolve => setTimeout(resolve, 250));
		}
		
		// Close dialog
		await new Promise(resolve => setTimeout(resolve, 500));
		const closeBtn = ref.document.querySelector('.popup_box_close');
		if (closeBtn) {
			closeBtn.click();
			debug('szem4_EPITO_collectRewards', 'Closed rewards dialog');
		}
		
		// Return result based on how many rewards collected
		if (claimedCount >= 2) {
			naplo('Építő', `🎁 ${claimedCount} jutalom összegyűjtve! Builder újraellenőrzés 1 percen belül / ${claimedCount} rewards collected! Builder recheck within 1 minute`);
			debug('szem4_EPITO_collectRewards', `Collected ${claimedCount} rewards - quick recheck enabled`);
			return true; // Signal: collected enough to warrant quick recheck
		} else if (claimedCount > 0) {
			naplo('Építő', `🎁 ${claimedCount} jutalom összegyűjtve / ${claimedCount} reward collected (kevés / few)`);
			debug('szem4_EPITO_collectRewards', `Only ${claimedCount} reward collected - not enough for quick recheck`);
			return false;
		} else {
			debug('szem4_EPITO_collectRewards', 'No rewards collected');
			return false;
		}
		
	} catch(e) {
		debug('szem4_EPITO_collectRewards', `Error: ${e}`);
		// Try to close any open dialog
		try {
			const closeBtn = ref.document.querySelector('.popup_box_close');
			if (closeBtn) closeBtn.click();
		} catch(e2) {}
		return false;
	}
}

function szem4_EPITO_forceReturn(villageRow) {
	try {
		const now = getServerTime();
		villageRow.cells[2].setAttribute('data-timestamp', now.getTime());
		villageRow.cells[2].innerHTML = now.toLocaleString();
		naplo('Építő', `⚡ Kényszerített Return: ${villageRow.cells[0].textContent} - Azonnal újraellenőrzés / Forced Return - Immediate recheck`);
		debug('szem4_EPITO_forceReturn', `Forced return for ${villageRow.cells[0].textContent}`);
		alert2('✅ Return idő azonnal beállítva! / Return time set to NOW!');
	} catch(e) {
		debug('szem4_EPITO_forceReturn', `Error: ${e}`);
	}
}

function szem4_EPITO_IntettiBuild(buildOrder){try{
	try{TamadUpdt(EPIT_REF);}catch(e){}
	var buildList=""; /*Current BuildingList IDs*/
	var allBuildTime=0; /*Ennyi perc építési idő, csak kiírás végett*/
	var firstBuildTime=0; /*Az első épület építési ideje*/
	var textTime;

	try {
		if (!EPIT_REF.document.getElementById("buildqueue")) throw 'No queue';
		var buildQueueRows=EPIT_REF.document.getElementById("buildqueue").rows;
		for (var i=1;i<buildQueueRows.length;i++) {try{
			// Skip rows without images (progress bars, separators)
			var imgElement = buildQueueRows[i].cells[0].getElementsByTagName("img")[0];
			if (!imgElement) continue;
			
			// Support both .png and .webp image formats
			var imgSrc = imgElement.src;
			var buildingMatch = imgSrc.match(/[A-Za-z0-9]+\.(png|webp)/g);
			if (buildingMatch) {
				buildList += buildingMatch[0].replace(/[0-9]+/g,"").replace(".png","").replace(".webp","");
				buildList += ";";
				
				// Calculate build times only for actual building rows
				textTime=buildQueueRows[i].cells[1].textContent.split(":");
				if (textTime.length >= 3) {
					allBuildTime+=parseInt(textTime[0])*60+parseInt(textTime[1])+(parseInt(textTime[2])/60);
					if (firstBuildTime==0) firstBuildTime=allBuildTime;
				}
			}
		}catch(e){
			// Silently skip invalid rows (progress bars, etc.)
		}}

		allBuildTime = Math.round(allBuildTime);
		firstBuildTime = Math.ceil(firstBuildTime);

		if (isNaN(allBuildTime)) allBuildTime = 5;
		if (isNaN(firstBuildTime)) firstBuildTime = 5;
		if (firstBuildTime>180) firstBuildTime=180;
		
		debug('szem4_EPITO_IntettiBuild', `Build queue detected: ${buildList} (${buildList.split(';').filter(x=>x).length} buildings)`);
	}catch(e){
		var buildList=";"; 
		var allBuildTime=0; 
		var firstBuildTime=0;
		debug('szem4_EPITO_IntettiBuild', `Error reading build queue: ${e}`);
	}
	
	if (buildList === '') buildList = ';';
	buildList=buildList.split(";");
	buildList.pop();

	/* Auto-Finish Check - Click free instant complete button if <=2:59 remaining */
	if (EPIT_AUTO_FINISH.enabled && firstBuildTime > 0 && firstBuildTime <= 3) {
		try {
			const freeFinishBtn = EPIT_REF.document.querySelector('a.btn-instant-free');
			if (freeFinishBtn) {
				debug('szem4_EPITO_IntettiBuild', `Auto-Finish: Found free finish button! Time remaining: ${firstBuildTime} min`);
				naplo("Építő", `⚡ Auto-Finish: ${EPIT_REF.game_data.village.name} - Ingyenes befejezés (${firstBuildTime} perc)`);
				szem4_EPITO_infoCell(PMEP[2], "alap", `⚡ Auto-Finish: Ingyenes befejezés... / Free instant complete...`);
				freeFinishBtn.click();
				// Set short return time to recheck after the instant complete
				szem4_EPITO_addIdo(PMEP[2], 0.2); // ~12 seconds
				debug('szem4_EPITO_IntettiBuild', 'Auto-Finish: Button clicked, returning to let page refresh');
				return;
			} else {
				debug('szem4_EPITO_IntettiBuild', `Auto-Finish: No free button found (time: ${firstBuildTime} min) - button may not be available yet`);
			}
		} catch(e) {
			debug('szem4_EPITO_IntettiBuild', `Auto-Finish error: ${e}`);
		}
	}

	// Check premium status for queue size limit (multiple detection methods)
	let isPremiumUser = false;
	try {
		// Method 1: game_data.player.premium
		if (EPIT_REF.game_data && EPIT_REF.game_data.player && EPIT_REF.game_data.player.premium) {
			isPremiumUser = true;
		}
		// Method 2: Check for 3+ buildings in queue (only premium can do this)
		else if (buildList.length >= 3) {
			isPremiumUser = true;
			debug('szem4_EPITO_IntettiBuild', 'Premium detected by queue size (3+ buildings)');
		}
		// Method 3: Check DOM for premium indicator
		else if (EPIT_REF.document.querySelector('.icon.header.premium')) {
			isPremiumUser = true;
			debug('szem4_EPITO_IntettiBuild', 'Premium detected by DOM premium icon');
		}
	} catch(e) {
		debug('szem4_EPITO_IntettiBuild', `Premium detection error: ${e}. Assuming Free account.`);
		isPremiumUser = false;
	}
	
	const maxQueueCapacity = isPremiumUser ? 5 : 2;
	
	if (buildList.length >= maxQueueCapacity) {
		const premiumBadge = isPremiumUser ? '👑 Premium' : '🆓 Free';
		szem4_EPITO_infoCell(PMEP[2],"alap",`✅ Építési sor megtelt! / Build queue full! ${premiumBadge} (${buildList.length}/${maxQueueCapacity}). ` + writeAllBuildTime(allBuildTime));
		szem4_EPITO_addIdo(PMEP[2],firstBuildTime);
		
		// Keep window open but set title to show waiting status
		if (EPIT_REF && !EPIT_REF.closed) {
			let nextCheck = new Date(parseInt(PMEP[2].cells[2].getAttribute('data-timestamp'), 10));
			EPIT_REF.document.title = `⏳ Szem4/építő - Waiting until ${nextCheck.toLocaleTimeString()}`;
			debug('szem4_EPITO_IntettiBuild', `Builder window kept open - queue full (${buildList.length}/${maxQueueCapacity}), waiting until ${nextCheck.toLocaleString()}`);
		}
		
		debug('szem4_EPITO_IntettiBuild', `Early queue check: Queue is full (${buildList.length}/${maxQueueCapacity}), Premium: ${isPremiumUser}. Next check: ${new Date(parseInt(PMEP[2].cells[2].getAttribute('data-timestamp'), 10)).toLocaleString()}`);
		return;
	}
	
	/* Jelenlegi épületszintek kiszámítása építési sorral együtt */
	let currentBuildLvls=EPIT_REF.game_data.village.buildings;
	currentBuildLvls = Object.fromEntries(Object.entries(currentBuildLvls).map(([key, value]) => [key, parseInt(value)]));
	
	for (var i=0;i<buildList.length;i++) {
		currentBuildLvls[buildList[i]]++;
	}

	/* Force Farm Check - Override build order if population is low */
	let forceFarmTriggered = false;
	if (EPIT_FORCE_FARM.enabled) {
		const popMax = EPIT_REF.game_data.village.pop_max;
		const popUsed = EPIT_REF.game_data.village.pop;
		const popFree = popMax - popUsed;
		const freePercent = (popFree / popMax) * 100;

		if (freePercent < EPIT_FORCE_FARM.threshold) {
			// Check edge cases before forcing farm
			if (currentBuildLvls['farm'] >= 30) {
				// Farm is maxed - can't force, show warning and continue with normal build
				debug('szem4_EPITO_IntettiBuild', `Force Farm: SKIP - Farm already at max level 30. Free pop: ${freePercent.toFixed(1)}%`);
				naplo("Építő", `⚠️ Force Farm: Tanya MAX (30)! Szabad: ${popFree}/${popMax} (${freePercent.toFixed(1)}%)`);
			} else if (buildList.includes('farm')) {
				// Farm already in queue - skip forcing
				debug('szem4_EPITO_IntettiBuild', `Force Farm: SKIP - Farm already in build queue. Free pop: ${freePercent.toFixed(1)}%`);
			} else {
				// Force farm build!
				forceFarmTriggered = true;
				debug('szem4_EPITO_IntettiBuild', `Force Farm: TRIGGERED! Free pop: ${popFree}/${popMax} (${freePercent.toFixed(1)}%) < ${EPIT_FORCE_FARM.threshold}%`);
				naplo("Építő", `🌾 Force Farm: ${EPIT_REF.game_data.village.name} - Szabad: ${popFree}/${popMax} (${freePercent.toFixed(1)}%)`);
			}
		}
	}

	/* Következő építendő épület meghatározása */
	var nextToBuild = forceFarmTriggered ? 'farm' : '';

	/* Only process build order if force farm didn't trigger */
	if (!forceFarmTriggered) {
		var buildOrderArr=buildOrder.split(";");
		for (var i=0;i<buildOrderArr.length;i++) {
			let cel = buildOrderArr[i].split(' ');
			cel[1] = parseInt(cel[1]);
			if (cel[0] == 'MINES') {
				let smallest = 31;
				if (currentBuildLvls['wood'] < cel[1]) {
					smallest = currentBuildLvls['wood'];
					nextToBuild = 'wood';
				}
				if (currentBuildLvls['stone'] < cel[1] && currentBuildLvls['stone'] < smallest) {
					smallest = currentBuildLvls['stone'];
					nextToBuild = 'stone';
				}
				if (currentBuildLvls['iron'] < cel[1] && currentBuildLvls['iron'] < smallest) {
					smallest = currentBuildLvls['iron'];
					nextToBuild = 'iron';
				}
				if (nextToBuild != '') break;
			}
			// TODO: FASTEST
			if (currentBuildLvls[cel[0]] < cel[1]) {
				nextToBuild = cel[0];
				break;
			}
		}
	}

	/* Minden épület kész */
	if (nextToBuild === '') {
		naplo("Építő",'🎉 <a href="'+VILL1ST.replace(/(village=)[0-9]+/g,"village="+PMEP[0])+'" target="_BLANK">'+EPIT_REF.game_data.village.name+" ("+EPIT_REF.game_data.village.x+"|"+EPIT_REF.game_data.village.y+")</a> falu teljesen felépült és törlődött a listából / Village fully built and removed from list");
		setTimeout(() => playSound("falu_kesz"), 1500);
		szem4_EPITO_addIdo(PMEP[2],"del");
		debug('szem4_EPITO_IntettiBuild', `Village ${EPIT_REF.game_data.village.name} completed all buildings in list`);
		return;
	}

	/* Cél szükségeletének lekérése */
	var nextToBuildRow = EPIT_REF.document.getElementById('main_buildrow_' + nextToBuild);
	if (!nextToBuildRow) {
		szem4_EPITO_infoCell(PMEP[2],firstBuildTime==0?"red":"yellow", `⚠️ ${nextToBuild} nem építhető. / ${nextToBuild} cannot be built. Előfeltétel szükséges? / Prerequisite required? ` + writeAllBuildTime(allBuildTime));
		szem4_EPITO_addIdo(PMEP[2], firstBuildTime>0?firstBuildTime:60);
		debug('szem4_EPITO_IntettiBuild', `Building row not found for ${nextToBuild} - prerequisite missing or invalid building ID`);
		return;
	}
	var resNeed = {
		wood: parseInt(nextToBuildRow.cells[1].textContent.match(/[0-9]+/g),10),
		stone: parseInt(nextToBuildRow.cells[2].textContent.match(/[0-9]+/g),10),
		iron: parseInt(nextToBuildRow.cells[3].textContent.match(/[0-9]+/g),10),
		pop: parseInt(nextToBuildRow.cells[5].textContent.match(/[0-9]+/g),10)
	}
	if (Math.max(resNeed.wood, resNeed.stone, resNeed.iron) > EPIT_REF.game_data.village.storage_max) nextToBuild = 'storage+';
	if (resNeed.pop > (EPIT_REF.game_data.village.pop_max - EPIT_REF.game_data.village.pop)) nextToBuild = 'farm+';
	if (nextToBuild == 'farm+' && EPIT_REF.game_data.village.buildings.farm == 30) {
		szem4_EPITO_infoCell(PMEP[2],"red","❌ Tanya megtelt (30), építés nem folytatható! / Farm maxed (30), cannot continue building! " + writeAllBuildTime(allBuildTime));
		szem4_EPITO_addIdo(PMEP[2], 120);
		debug('szem4_EPITO_IntettiBuild', 'Farm is maxed at level 30, cannot build further');
		return;
	}
	if (nextToBuild == 'farm+' && buildList.includes('farm')) {
		szem4_EPITO_infoCell(PMEP[2],'yellow', '⏳ Tanya megtelt, de már építés alatt... / Farm full, but already building... ' + writeAllBuildTime(allBuildTime));
		szem4_EPITO_addIdo(PMEP[2], 120);
		return;
	}
	if (nextToBuild == 'farm+' || nextToBuild == 'storage+') {
		nextToBuild = nextToBuild.slice(0, -1);
		nextToBuildRow = EPIT_REF.document.getElementById('main_buildrow_' + nextToBuild);
		resNeed = {
			wood: parseInt(nextToBuildRow.cells[1].textContent.match(/[0-9]+/g),10),
			stone: parseInt(nextToBuildRow.cells[2].textContent.match(/[0-9]+/g),10),
			iron: parseInt(nextToBuildRow.cells[3].textContent.match(/[0-9]+/g),10),
			pop: 0
		}
		// Farm kéne, de raktár nincs hozzá ~>
		if (Math.max(resNeed.wood, resNeed.stone, resNeed.iron) > EPIT_REF.game_data.village.storage_max) {
			nextToBuild = 'storage';
			nextToBuildRow = EPIT_REF.document.getElementById('main_buildrow_' + nextToBuild);
			resNeed = {
				wood: parseInt(nextToBuildRow.cells[1].textContent.match(/[0-9]+/g),10),
				stone: parseInt(nextToBuildRow.cells[2].textContent.match(/[0-9]+/g),10),
				iron: parseInt(nextToBuildRow.cells[3].textContent.match(/[0-9]+/g),10),
				pop: 0
			}
		}
	}

	if (EPIT_REF.game_data.village.wood < resNeed.wood || EPIT_REF.game_data.village.stone < resNeed.stone || EPIT_REF.game_data.village.iron < resNeed.iron) {
		const missing = [];
		if (EPIT_REF.game_data.village.wood < resNeed.wood) missing.push(`🪵 ${resNeed.wood - EPIT_REF.game_data.village.wood}`);
		if (EPIT_REF.game_data.village.stone < resNeed.stone) missing.push(`🧱 ${resNeed.stone - EPIT_REF.game_data.village.stone}`);
		if (EPIT_REF.game_data.village.iron < resNeed.iron) missing.push(`⚒️ ${resNeed.iron - EPIT_REF.game_data.village.iron}`);
		
		// Check if quest rewards are available
		const questButton = EPIT_REF.document.getElementById('new_quest');
		const hasQuestRewards = questButton && questButton.style.display !== 'none';
		
		if (hasQuestRewards) {
			// Try to collect ALL quest rewards to get resources
			szem4_EPITO_infoCell(PMEP[2],"yellow",`⚠️ Nyersanyag hiány! 🎁 Összes jutalom gyűjtése... / Resource shortage! Collecting ALL rewards... ${nextToBuild}`);
			debug('szem4_EPITO_IntettiBuild', `Resource shortage. Collecting ALL available rewards. Missing: ${missing.join(', ')}`);
			
			// Start async reward collection and handle result
			szem4_EPITO_collectRewards(EPIT_REF, nextToBuild, resNeed, PMEP[2]).then((collectedEnough) => {
				// Get fresh reference to village row (PMEP might be stale)
				const allRows = document.getElementById("epit_lista").rows;
				let targetRow = null;
				for (let i = 1; i < allRows.length; i++) {
					if (allRows[i].cells[0].textContent === PMEP[2].cells[0].textContent) {
						targetRow = allRows[i];
						break;
					}
				}
				
				if (targetRow) {
					if (collectedEnough) {
						// Collected >= 2 rewards → Quick recheck in 1 minute
						szem4_EPITO_addIdo(targetRow, 1);
						szem4_EPITO_infoCell(targetRow, "yellow", `🎁 Jutalmak gyűjtve! Újraellenőrzés 1 percen belül / Rewards collected! Recheck in 1 min`);
						debug('szem4_EPITO_collectRewards', 'Quick recheck scheduled (1 minute)');
					} else {
						// Collected < 2 or none → Normal waiting
						szem4_EPITO_addIdo(targetRow, firstBuildTime>0?Math.min(firstBuildTime, 60):20);
						szem4_EPITO_infoCell(targetRow, "yellow", `⚠️ Kevés jutalom. Normál várakozás / Few rewards. Normal wait`);
						debug('szem4_EPITO_collectRewards', 'Normal wait time scheduled');
					}
				}
			});
			
			// Set initial return time (will be updated by callback)
			szem4_EPITO_addIdo(PMEP[2], 2);
		} else {
			// No quest rewards - wait for production
			szem4_EPITO_infoCell(PMEP[2],"yellow",`⚠️ Nyersanyag hiány! / Resource shortage! ${nextToBuild} - Hiányzik/Missing: ${missing.join(', ')}. ` + writeAllBuildTime(allBuildTime));
			szem4_EPITO_addIdo(PMEP[2],firstBuildTime>0?Math.min(firstBuildTime, 60):20);
			debug('szem4_EPITO_IntettiBuild', `Resource shortage for ${nextToBuild}. Missing: ${missing.join(', ')}. No quest rewards available, waiting for production.`);
		}
		return;
	} 

	/* Minden rendben, építhető, klikk */
	szem4_EPITO_infoCell(PMEP[2],"alap","Építés folyamatban. / Building in progress.");
	var buildBtn = nextToBuildRow.querySelector('.btn.btn-build');
	if (!buildBtn || buildBtn.style.display == 'none') {
		// Enhanced error detection
		let errorMsg = '';
		let errorColor = 'red';
		let retryTime = 60;
		
		// Detect premium status to determine max queue size (use same detection as above)
		let isPremium = false;
		try {
			if (EPIT_REF.game_data && EPIT_REF.game_data.player && EPIT_REF.game_data.player.premium) {
				isPremium = true;
			} else if (buildList.length >= 3) {
				isPremium = true;
			} else if (EPIT_REF.document.querySelector('.icon.header.premium')) {
				isPremium = true;
			}
		} catch(e) {
			isPremium = false;
		}
		const maxQueueSize = isPremium ? 5 : 2;
		const queueLimit = isPremium ? 5 : 2;
		
		// Check if building is already at max level
		const currentLevel = currentBuildLvls[nextToBuild];
		if (currentLevel >= 30) {
			errorMsg = `❌ ${nextToBuild} már maximális szinten (30)! / ${nextToBuild} already at max level (30)! Építési lista frissítése szükséges. / Update build list needed.`;
			errorColor = 'red';
			retryTime = 300; // 5 minutes
			debug('szem4_EPITO_IntettiBuild', `Building ${nextToBuild} is maxed at level ${currentLevel}`);
		}
		// Check if page is fully loaded
		else if (!EPIT_REF.document.querySelector('#buildings')) {
			errorMsg = `⚠️ Oldal nem töltődött be teljesen. / Page not fully loaded. Újrapróbálás... / Retrying...`;
			errorColor = 'yellow';
			retryTime = 10;
			debug('szem4_EPITO_IntettiBuild', 'Buildings div not found - page not loaded');
		}
		// Check if build button exists at all
		else if (!buildBtn) {
			// Check if building requires prerequisites
			const buildRow = EPIT_REF.document.getElementById('main_buildrow_' + nextToBuild);
			if (buildRow && buildRow.querySelector('.inactive')) {
				errorMsg = `⚠️ ${nextToBuild} előfeltétele hiányzik! / ${nextToBuild} prerequisite missing! Ellenőrizd a listát. / Check your list.`;
				errorColor = 'yellow';
				retryTime = 120;
				debug('szem4_EPITO_IntettiBuild', `Building ${nextToBuild} has missing prerequisite`);
			} else {
				errorMsg = `❌ ${nextToBuild} építési gomb nem található! / ${nextToBuild} build button not found! Esetleg nem létező épület? / Invalid building ID?`;
				errorColor = 'red';
				retryTime = 300;
				debug('szem4_EPITO_IntettiBuild', `Build button for ${nextToBuild} not found in DOM`);
			}
		}
		// Build button exists but is hidden
		else {
			// Check if queue is full based on premium status
			if (buildList.length >= maxQueueSize) {
				const premiumStatus = isPremium ? '👑 Premium' : '🆓 Free';
				errorMsg = `✅ Építkezési sor megtelt! / Build queue full! ${premiumStatus} (${buildList.length}/${queueLimit}). ` + writeAllBuildTime(allBuildTime);
				errorColor = 'alap';
				retryTime = firstBuildTime > 0 ? firstBuildTime : 60;
				
				// Keep window open but update title
				if (EPIT_REF && !EPIT_REF.closed) {
					EPIT_REF.document.title = `⏳ Szem4/építő - Queue full, waiting...`;
					debug('szem4_EPITO_IntettiBuild', `Builder window kept open - queue full at button check (${buildList.length}/${queueLimit})`);
				}
				
				debug('szem4_EPITO_IntettiBuild', `Queue full: ${buildList.length}/${queueLimit} (Premium: ${isPremium})`);
			} else {
				// Button is hidden for unknown reason
				const buildingInfo = EPIT_REF.document.querySelector(`#main_buildrow_${nextToBuild}`);
				if (buildingInfo) {
					const infoText = buildingInfo.textContent;
					if (infoText.includes('max') || infoText.includes('Max')) {
						errorMsg = `❌ ${nextToBuild} elérte a maximumot! / ${nextToBuild} reached maximum! Töröld a listából. / Remove from list.`;
						errorColor = 'red';
						retryTime = 300;
					} else if (infoText.includes('pontok') || infoText.includes('points')) {
						errorMsg = `⚠️ Nem elég pontod ehhez az épülethez! / Not enough points for this building! ${nextToBuild}`;
						errorColor = 'yellow';
						retryTime = 120;
					} else {
						const premiumStatus = isPremium ? '👑 Premium' : '🆓 Free';
						errorMsg = `❓ ${nextToBuild} nem építhető (ismeretlen ok). / ${nextToBuild} cannot be built (unknown reason). Gomb rejtett de sor nem telt. / Button hidden but queue not full. ${premiumStatus} Queue: ${buildList.length}/${queueLimit}. ` + writeAllBuildTime(allBuildTime);
						errorColor = 'yellow';
						retryTime = 30;
					}
				} else {
					errorMsg = `❌ ${nextToBuild} sor nem található az oldalon! / ${nextToBuild} row not found on page! Érvénytelen épület ID? / Invalid building ID?`;
					errorColor = 'red';
					retryTime = 300;
				}
				debug('szem4_EPITO_IntettiBuild', `Build button hidden but queue not full. Premium: ${isPremium}, Queue: ${buildList.length}/${queueLimit}, List: ${buildList.join(',')}, NextToBuild: ${nextToBuild}`);
			}
		}
		
		szem4_EPITO_infoCell(PMEP[2], errorColor, errorMsg);
		szem4_EPITO_addIdo(PMEP[2], retryTime);
		return;
	}
	
	// Everything OK, click the button
	buildBtn.click();
	playSound("epites");
	debug('szem4_EPITO_IntettiBuild', `Successfully clicked build button for ${nextToBuild}`);
}catch(e){
	debug("epit_IntelliB", `ERROR: ${e} | Village: ${EPIT_REF.game_data.village.name} | NextToBuild: ${nextToBuild || 'unknown'}`);
	szem4_EPITO_infoCell(PMEP[2],"red",`💥 Kritikus hiba / Critical error: ${e.message || e}`);
	szem4_EPITO_addIdo(PMEP[2], 120);
}}

function szem4_EPITO_motor(){try{
	var nexttime=750;
	if (BOT||EPIT_PAUSE||USER_ACTIVITY) {nexttime=5000;}
	else if (NORBI0N_FARM_LEPES !== 0) {nexttime=3000;} // Wait for Norbi0N_Farm
	else {
	if (EPIT_HIBA>10) {EPIT_HIBA=0; EPIT_GHIBA++; if(EPIT_GHIBA>3) {if (EPIT_GHIBA>5) {naplo("Globál","Nincs internet? Folyamatos hiba az építőnél"); nexttime=60000; playSound("bot2");} EPIT_REF.close();} EPIT_LEPES=0;}
	switch (EPIT_LEPES) {
		case 0: PMEP=szem4_EPITO_Wopen(); /*FaluID;lista;link_a_faluhoz*/
				if (PMEP[0]) {
					// Village is ready - open or reuse window
					if (!EPIT_REF || EPIT_REF.closed) {
						EPIT_REF=windowOpener('epit', VILL1ST.replace("screen=overview","screen=main").replace(/village=[0-9]+/,"village="+PMEP[0]), AZON+"_SZEM4EPIT");
						debug('szem4_EPITO_motor', `Opening NEW window for village: ${PMEP[0]}`);
					} else {
						// Reuse existing window, just navigate to new village
						EPIT_REF.location.href = VILL1ST.replace("screen=overview","screen=main").replace(/village=[0-9]+/,"village="+PMEP[0]);
						debug('szem4_EPITO_motor', `Reusing window, navigating to village: ${PMEP[0]}`);
					}
					EPIT_LEPES=1;
				} else {
					// No village ready - keep window open but update title
					if (EPIT_REF && !EPIT_REF.closed) {
						if (MOBILE_MODE) {
							// On mobile, close to save resources
							EPIT_REF.close();
							debug('szem4_EPITO_motor', 'No village ready, closing window (MOBILE_MODE)');
						} else {
							// On desktop, keep open for faster response
							EPIT_REF.document.title = '💤 Szem4/építő - Várakozás / Waiting';
							debug('szem4_EPITO_motor', 'No village ready, keeping window open but idle');
						}
					}
					if (document.getElementById("epit_lista").rows.length==1) {
						nexttime=5000;
						debug('szem4_EPITO_motor', 'No villages in builder list, waiting 5s');
					} else {
						nexttime=60000;
						debug('szem4_EPITO_motor', 'Villages waiting for Return time, next check in 60s');
					}
				}
				if (EPIT_REF && !EPIT_REF.closed && EPIT_LEPES == 1) EPIT_REF.document.title = '🔨 Szem4/építő - Építés / Building';
				break;
		case 1: if (isPageLoaded(EPIT_REF,PMEP[0],"screen=main", ['#buildings'])) {EPIT_HIBA=0; EPIT_GHIBA=0;
					szem4_EPITO_IntettiBuild(PMEP[1]);
				} else {EPIT_HIBA++;}
				EPIT_LEPES=0;
				break;
		default: EPIT_LEPES=0;
	}
	
	/*
	1.) Megnézzük melyik falut kell megnyitni -->főhadi.
	2.) <5 sor? Mit kell venni? Lehetséges e? Ha nem, lehet e valamikor az életbe? (tanya/raktár-vizsgálat)
	3.) Nincs! xD
	*/}
}catch(e){debug("Epito motor",e); EPIT_LEPES=0;}
var inga=100/((Math.random()*40)+80);
nexttime=Math.round(nexttime*inga);
try{
	worker.postMessage({'id': 'epit', 'time': nexttime});
}catch(e){debug('epit', 'Worker engine error: ' + e);setTimeout(function(){szem4_EPITO_motor();}, 3000);}}

ujkieg_hang("Építő","epites;falu_kesz;kritikus_hiba");
ujkieg("epit","Építő",'<tr><td><h2 align="center">Építési listák</h2><table align="center" class="vis" style="border:1px solid black;color: black;"><tr><th onmouseover=\'sugo(this,"Építési lista neve, amire később hivatkozhatunk")\'>Csoport neve</th><th onmouseover=\'sugo(this,"Az építési sorrend megadása. Saját lista esetén ellenőrizzük az OK? linkre kattintva annak helyességét!")\' style="width:800px">Építési lista</th></tr><tr><td>Alapértelmezett</td><td><input type="text" disabled="disabled" value="main 10;storage 10;wall 10;main 15;wall 15;storage 15;farm 10;main 20;wall 20;MINES 10;smith 5;barracks 5;stable 5;storage 20;farm 20;market 10;main 22;smith 12;farm 25;storage 28;farm 26;MINES 24;market 19;barracks 15;stable 10;garage 5;MINES 26;farm 28;storage 30;barracks 20;stable 15;farm 30;barracks 25;stable 20;MINES 30;smith 20;snob 1" size="125"><a onclick="szem4_EPITO_cscheck(this)" style="color:blue; cursor:pointer;"> OK?</a></td></tr></table><p align="center">Csoportnév: <input type="text" value="" size="30" id="epit_ujcsopnev" placeholder="Nem tartalmazhat . _ ; karaktereket"> <a href="javascript: szem4_EPITO_ujCsop()" style="color:white;text-decoration:none;"><img src="'+pic("plus.png")+' " height="17px"> Új csoport</a></p></td></tr>\
<tr><td>\
<table align="center" class="vis" style="border:1px solid black;color:black;width:600px;margin:10px auto;">\
<tr><th colspan="2" style="background:#c1a264;color:#000;">Építő Beállítások / Builder Settings</th></tr>\
<tr>\
<td style="padding:8px;" onmouseover=\'sugo(this,"Ha a falu szabad népessége a megadott % alá esik, automatikusan Tanyát épít a listától függetlenül.<br><br>Példa: 10% = ha 1000 max népességből már 900+ használt, akkor tanyát épít.")\'>\
<input type="checkbox" id="epit_forcefarm_enabled" onchange="szem4_EPITO_applyForceFarmSettings()"> \
<strong>Force Farm</strong> - Tanya építése ha szabad népesség ez alatt: \
<select id="epit_forcefarm_threshold" onchange="szem4_EPITO_applyForceFarmSettings()" style="margin-left:5px;">\
<option value="5">5%</option>\
<option value="10">10%</option>\
<option value="15">15%</option>\
<option value="20">20%</option>\
</select>\
</td>\
<td style="padding:8px;width:200px;font-size:11px;color:#666;">\
Ha BE, és a szabad hely < küszöb, akkor Tanya épül először (ha lehet).\
</td>\
</tr>\
<tr>\
<td style="padding:8px;" onmouseover=\'sugo(this,"Ha az első építés hátralévő ideje 3 perc alatt van (≤2:59), automatikusan rákattint az INGYENES azonnali befejezés gombra.<br><br>Tribal Wars/Klánháború: 3 perc alatt az épület befejezése INGYENES!")\'>\
<input type="checkbox" id="epit_autofinish_enabled" onchange="szem4_EPITO_applyAutoFinishSettings()"> \
<strong>Auto-Finish</strong> - Ingyenes befejezés ha ≤2:59 van hátra\
</td>\
<td style="padding:8px;width:200px;font-size:11px;color:#666;">\
Ha BE, és ≤2:59 van hátra, automatikusan befejezi INGYEN.\
</td>\
</tr>\
</table>\
</td></tr>\
<tr><td><h2 align="center">Építendő faluk</h2><table align="center" class="vis" style="border:1px solid black;color: black;width:950px" id="epit_lista"><tr><th style="width: 250px;" onclick=\'rendez("szoveg",false,this,"epit_lista",0)\' onmouseover=\'sugo(this,"Rendezhető. Itt építek. Dupla klikk a falura = sor törlése")\'>Falu</th><th onclick=\'rendez("lista",false,this,"epit_lista",1)\' onmouseover=\'sugo(this,"Rendezhető. Felső táblázatban használt lista közül választhatsz egyet, melyet később bármikor megváltoztathatsz.")\' style="width: 135px;">Használt lista</th><th style="width: 130px; cursor: pointer;" onclick=\'rendez("datum",false,this,"epit_lista",2)\' onmouseover=\'sugo(this,"⏰ Return idő = Ekkor nézi újra a falut<br><br>🎁 AUTOMATIKUS: Nyersanyag hiány esetén jutalmakat próbál gyűjteni!<br><br>⚡ MANUÁLIS: Dupla klikk = Return MOST! (azonnal újraellenőrzés)")\'>⏰ Return</th><th style="cursor: pointer;" onclick=\'rendez("szoveg",false,this,"epit_lista",3)\' onmouseover=\'sugo(this,"Rendezhető. Szöveges információ a faluban zajló építésről.<br><br>Színek:<br>🟢 Alap = Normális működés<br>🟡 Sárga = Orvosolható (vár nyersre/építésre)<br>🔴 Piros = Kritikus hiba (beavatkozás kell)<br><br>Dupla klikk=alaphelyzet")\'><u>Infó</u></th></tr></table><p align="center" id="epit_ujfalu_adat">Csoport: <select><option value="Alapértelmezett">Alapértelmezett</option> </select> \Faluk: <input type="text" value="" placeholder="Koordináták: 123|321 123|322 ..." size="50"> \<a href="javascript: szem4_EPITO_ujFalu()" style="color:white;text-decoration:none;"><img src="'+pic("plus.png")+'" height="17px"> Új falu(k)</a> \
<a href="javascript: szem4_EPITO_importFromOverview()" style="color:#90caf9;text-decoration:none;margin-left:15px;" onmouseover=\'sugo(this,"Megnyitja a falu áttekintő oldalt és automatikusan beolvassa az ÖSSZES faludat!<br><br>Opens the village overview and automatically imports ALL your villages!")\'>📥 Import összes / Import all</a></p></td></tr>');
setTimeout(szem4_EPITO_initForceFarmUI, 100);
setTimeout(szem4_EPITO_initAutoFinishUI, 100);

var EPIT_LEPES=0;
var EPIT_REF; var EPIT_HIBA=0; var EPIT_GHIBA=0;
var PMEP; var EPIT_PAUSE=false;

/* Force Farm Settings - Auto-build farm when free population is low */
var EPIT_FORCE_FARM = {
	enabled: false,
	threshold: 10  // Percentage: 5, 10, 15, or 20
};

/* Auto-Finish Settings - Auto-click free instant complete button when <=2:59 remaining */
var EPIT_AUTO_FINISH = {
	enabled: false
};

/* Load Force Farm settings from localStorage */
function szem4_EPITO_loadForceFarmSettings() {
	try {
		const saved = localStorage.getItem(AZON + "_epit_forcefarm");
		if (saved) {
			const parsed = JSON.parse(saved);
			EPIT_FORCE_FARM.enabled = parsed.enabled || false;
			EPIT_FORCE_FARM.threshold = parsed.threshold || 10;
		}
	} catch(e) { debug("EPITO_loadForceFarm", e); }
}

/* Save Force Farm settings to localStorage */
function szem4_EPITO_saveForceFarmSettings() {
	try {
		localStorage.setItem(AZON + "_epit_forcefarm", JSON.stringify(EPIT_FORCE_FARM));
		debug("EPITO_saveForceFarm", `Saved: enabled=${EPIT_FORCE_FARM.enabled}, threshold=${EPIT_FORCE_FARM.threshold}%`);
	} catch(e) { debug("EPITO_saveForceFarm", e); }
}

/* Apply Force Farm settings from UI */
function szem4_EPITO_applyForceFarmSettings() {
	try {
		const checkbox = document.getElementById("epit_forcefarm_enabled");
		const select = document.getElementById("epit_forcefarm_threshold");
		if (checkbox && select) {
			EPIT_FORCE_FARM.enabled = checkbox.checked;
			EPIT_FORCE_FARM.threshold = parseInt(select.value, 10);
			szem4_EPITO_saveForceFarmSettings();
			naplo("Építő", `🌾 Force Farm: ${EPIT_FORCE_FARM.enabled ? 'BE' : 'KI'}, Küszöb: ${EPIT_FORCE_FARM.threshold}%`);
		}
	} catch(e) { debug("EPITO_applyForceFarm", e); }
}

/* Initialize Force Farm UI state */
function szem4_EPITO_initForceFarmUI() {
	try {
		const checkbox = document.getElementById("epit_forcefarm_enabled");
		const select = document.getElementById("epit_forcefarm_threshold");
		if (checkbox && select) {
			checkbox.checked = EPIT_FORCE_FARM.enabled;
			select.value = EPIT_FORCE_FARM.threshold;
		}
	} catch(e) { debug("EPITO_initForceFarmUI", e); }
}

szem4_EPITO_loadForceFarmSettings();

/* Load Auto-Finish settings from localStorage */
function szem4_EPITO_loadAutoFinishSettings() {
	try {
		const saved = localStorage.getItem(AZON + "_epit_autofinish");
		if (saved) {
			const parsed = JSON.parse(saved);
			EPIT_AUTO_FINISH.enabled = parsed.enabled || false;
		}
	} catch(e) { debug("EPITO_loadAutoFinish", e); }
}

/* Save Auto-Finish settings to localStorage */
function szem4_EPITO_saveAutoFinishSettings() {
	try {
		localStorage.setItem(AZON + "_epit_autofinish", JSON.stringify(EPIT_AUTO_FINISH));
		debug("EPITO_saveAutoFinish", `Saved: enabled=${EPIT_AUTO_FINISH.enabled}`);
	} catch(e) { debug("EPITO_saveAutoFinish", e); }
}

/* Apply Auto-Finish settings from UI */
function szem4_EPITO_applyAutoFinishSettings() {
	try {
		const checkbox = document.getElementById("epit_autofinish_enabled");
		if (checkbox) {
			EPIT_AUTO_FINISH.enabled = checkbox.checked;
			szem4_EPITO_saveAutoFinishSettings();
			naplo("Építő", `⚡ Auto-Finish: ${EPIT_AUTO_FINISH.enabled ? 'BE' : 'KI'}`);
		}
	} catch(e) { debug("EPITO_applyAutoFinish", e); }
}

/* Initialize Auto-Finish UI state */
function szem4_EPITO_initAutoFinishUI() {
	try {
		const checkbox = document.getElementById("epit_autofinish_enabled");
		if (checkbox) {
			checkbox.checked = EPIT_AUTO_FINISH.enabled;
		}
	} catch(e) { debug("EPITO_initAutoFinishUI", e); }
}

szem4_EPITO_loadAutoFinishSettings();
szem4_EPITO_motor();
szem4_EPITO_perccsokkento();

/*-----------------GYŰJTÖGETŐ--------------------*/
function gyujto_listAllVillages() {
	let rows = '';
	for (const key in KTID) {
		let faluId = KTID[key];
		rows += `<tr id="gy_${faluId}">
			<td>${ID_TO_INFO[faluId].name} (${key})</td>
			<td>${ID_TO_INFO[faluId].point}</td>
			<td>${ID_TO_INFO[faluId].pop}</td>
			<td onclick="gyujto_setVill(${faluId}, this)"><input name="f${faluId}" type="checkbox"></td>
			<td>---</td>
		</tr>`;
	}
	return rows;
}
function gyujto_setVill(villId, el, isForcedSingle=false, forcedValue) {
	const isMulti = document.querySelector('#gyujto_ismass').checked;
	if (!isForcedSingle && isMulti) {
		const multiOperationVal = !SZEM4_GYUJTO[villId];
		document.querySelectorAll(`#gyujto_form_table tr:not([style*="display: none"]) td input[type="checkbox"]`).forEach(el => {
			gyujto_setVill(el.getAttribute('name').replace('f', ''), el.parentElement, true, multiOperationVal);
		});
	} else {
		let newVal = true;
		if (forcedValue !== undefined) {
			newVal = forcedValue;
		} else {
			if (SZEM4_GYUJTO[villId] == undefined)
				newVal = true;
			else
				newVal= !SZEM4_GYUJTO[villId];
		}
		SZEM4_GYUJTO[villId] = newVal;
		el.querySelector('input').checked = SZEM4_GYUJTO[villId];
	}
}
function rebuildDOM_gyujto() {
	const f = document.querySelector('#gyujto_form');
	for (let villId in SZEM4_GYUJTO) {
		if (SZEM4_GYUJTO[villId] === true) f['f' + villId].checked = true;
	}
	f.strategy.value = SZEM4_GYUJTO.settings.strategy;
}
function szem4_GYUJTO_search(ev) {
	ev.stopImmediatePropagation();
	let vills = prompt('Szűrés ezen falukra:\nÜres=minden');
	const gyujtoTable = document.querySelector('#gyujto_form_table').rows;

	if (vills == '') {
		for (let i=1;i<gyujtoTable.length;i++) {
			gyujtoTable[i].style.display = 'table-row';
		}
	}
	if (!vills) return;
	vills = vills.match(/[0-9]{1,3}\|[0-9]{1,3}/g);
	if (!vills || vills.length < 1) return;

	
	for (let i=1;i<gyujtoTable.length;i++) {
		const tc = gyujtoTable[i].cells[0].textContent;
		if (vills.some(el => tc.includes(`(${el})`))) {
			gyujtoTable[i].style.display = 'table-row';
		} else {
			gyujtoTable[i].style.display = 'none';
		}
	}
}
function szem4_GYUJTO_1keres() {try{
	let d = getServerTime();
	for (const coord in KTID) {
		const villId = KTID[coord];
		if (!GYUJTO_VILLINFO[villId]) GYUJTO_VILLINFO[villId] = { retry: false };
		if (SZEM4_GYUJTO[villId] === true && (!GYUJTO_VILLINFO[villId].returned || GYUJTO_VILLINFO[villId].returned < d)) {
			GYUJTO_REF = windowOpener('gyujto', VILL1ST.replace(/village=[0-9]+/g, 'village=' + villId).replace('screen=overview','screen=place&mode=scavenge'), AZON + '_gyujto');
			GYUJTO_STATE = 1;
			GYUJTO_DATA = villId;
			return false;
		}
	}
	return true;
} catch(e) { GYUJTO_HIBA++; console.error(e); debug('szem4_GYUJTO_1keres', e); }}
function szem4_GYUJTO_3elindit() { try{
	const buttons = GYUJTO_REF.document.querySelectorAll('#scavenge_screen .free_send_button');
	let startButton, scavTime;
	if (buttons.length > 0) {
		startButton = buttons[buttons.length-1];
		scavTime = startButton.closest('.scavenge-option').querySelector('.duration-section');
	}
	if (buttons.length == 0 || scavTime.style.display == 'none') {
		if (buttons.length > 0 && GYUJTO_VILLINFO[GYUJTO_DATA].retry !== true) {
			GYUJTO_VILLINFO[GYUJTO_DATA].retry = true;
			GYUJTO_STATE = 0;
			return;
		}
		if (buttons.length > 0) {
			console.info(new Date().toLocaleString(), `faluId: ${GYUJTO_DATA} STILL VÉGE`, buttons.length, buttons, scavTime.style.display, scavTime.innerHTML);
			debug('szem4_GYUJTO_3elindit', 'Hiba? Gyűjtögető úgy véli végzett, 2x is, de nem minden slot foglalt');
			playSound('naplobejegyzes');
		}
		GYUJTO_VILLINFO[GYUJTO_DATA].retry = false;
		GYUJTO_STATE = 0;
		const allReturnTimer = GYUJTO_REF.document.querySelectorAll('.return-countdown');
		let d = getServerTime(GYUJTO_REF);
		if (allReturnTimer.length == 0) {
			// Nem lehet gyűjtögetni itt. 20p múlva újra nézi
			GYUJTO_VILLINFO[GYUJTO_DATA].returned = d.setSeconds(d.getSeconds() + 1200);
		} else {
			const timesInSec = [];
			allReturnTimer.forEach(el => {
				let [hours, minutes, seconds] = el.textContent.split(":").map(Number);
				timesInSec.push(hours * 3600 + minutes * 60 + seconds);
			});
	
			const nextTime = SZEM4_GYUJTO.settings.strategy === 'max' ? Math.max(...timesInSec) : Math.min(...timesInSec);
			GYUJTO_VILLINFO[GYUJTO_DATA].returned = d.setSeconds(d.getSeconds() + nextTime + 60);
		}

		document.querySelector(`#gy_${GYUJTO_DATA}`).cells[4].innerHTML = new Date(GYUJTO_VILLINFO[GYUJTO_DATA].returned).toLocaleString();
		GYUJTO_HIBA = 0;
		return;
	}
	GYUJTO_VILLINFO[GYUJTO_DATA].retry = false;
	GYUJTO_HIBA++;
	startButton.click();
} catch(e) { GYUJTO_HIBA++; console.error(e); debug('szem4_GYUJTO_3elindit', e); }}
function szem4_GYUJTO_motor() {
	let nexttime = 500;
	try {
		if (BOT||GYUJTO_PAUSE||USER_ACTIVITY) {
			nexttime=5000;
		} else if (NORBI0N_FARM_LEPES !== 0) {
			nexttime=3000; // Wait for Norbi0N_Farm
		} else {
			if (GYUJTO_HIBA > 30) {
				naplo('szem4_GYUJTO_motor', 'Valami baj van a gyűjtögetőnél - újraindítom...');
				GYUJTO_REF.close();
				GYUJTO_STATE = 0;
				GYUJTO_HIBA = 0;
			}
			switch (GYUJTO_STATE) {
				case 0:
					// Search & OpenVill
					if (szem4_GYUJTO_1keres()) {
						nexttime = 60000;
						if (MOBILE_MODE) GYUJTO_REF.close()
					}
					if (GYUJTO_REF && GYUJTO_REF.document) GYUJTO_REF.document.title = 'szem4/gyűjtögető';
					break;
				case 1:
					// run 3rdparty script
					if (isPageLoaded(GYUJTO_REF, GYUJTO_DATA, 'screen=place&mode=scavenge', ['#scavenge_screen .scavenge-option'])) {
						GYUJTO_REF.$.getScript('https://media.innogames.com/com_DS_HU/scripts/scavenging.js');
						GYUJTO_STATE = 2;
					} else GYUJTO_HIBA++;
					break;
				case 2:
					// Check, click, store
					if (isPageLoaded(GYUJTO_REF, GYUJTO_DATA, 'screen=place&mode=scavenge', ['#twcheese-sidebar', '#content_value > h3 > a'])) {
						szem4_GYUJTO_3elindit();
					} else {
						GYUJTO_HIBA++;
						if (GYUJTO_HIBA == 15) GYUJTO_REF.$.getScript('https://media.innogames.com/com_DS_HU/scripts/scavenging.js');
					}
					break;
			}
		}
	} catch(e) {
		console.error(e);
		debug('gyujto_motor', e);
	}
	try{
		worker.postMessage({'id': 'gyujto', 'time': nexttime});
	}catch(e){debug('gyujto_motor', 'Worker engine error: ' + e);setTimeout(function(){szem4_GYUJTO_motor();}, 1000);}
}
var SZEM4_GYUJTO = {
	settings: {
		strategy: 'max'
	}
}, //VillId: isEnabled
GYUJTO_VILLINFO = {}, // villId: {returned: xxxDatexxx, retry: bool}
GYUJTO_STATE = 0,
GYUJTO_REF,
GYUJTO_DATA,
GYUJTO_HIBA = 0,
GYUJTO_PAUSE = true;
ujkieg('gyujto','Gyűjtő',`<tr><td>
	<h2 align="center">3rdparty gyűjtögető</h2>
	<h4 align="center">Powered by TwCheese</h4>
	<br><br>
	Ez a script külön beállítást igényel. Ehhez az alábbi, legálisan is futtható scriptet kell futtatnod a gyülekezőhelyeden, a gyűjtögetésnél:<br>
	<pre>$.getScript('https://media.innogames.com/com_DS_HU/scripts/scavenging.js');</pre><br>
	SZEM ezt a scriptet fogja automata módban futtatni az alább bejelöld faluidban, az ott beállított módon.<br>
	<form id="gyujto_form">
		<table class="vis gyujto_table" id="gyujto_form_table">
			<thead><tr>
				<th onclick="rendez('szoveg', false, this, 'gyujto_form_table', 0)">Falu
					<img src="${pic("search.png")}" alt="Szűrő" title="Szűrés falukra..." onclick="szem4_GYUJTO_search(event)">
					<input type="checkbox" onclick="stopEvent(event)" id="gyujto_ismass" onmouseover="sugo(this,'Tömeges kezelés: minden látott falura érvényes lesz a további művelet')" title="Tömeges kezelés"></th>
				<th onclick="rendez('szam', false, this, 'gyujto_form_table', 1)">Pont</th>
				<th onclick="rendez('tanya', false, this, 'gyujto_form_table', 2)">Tanya</th>
				<th onclick="rendez('checkbox', false, this, 'gyujto_form_table', 3)">Gyűjtögetés?</th>
				<th onclick="rendez('datum', false, this, 'gyujto_form_table', 4)">Gyűjtés eddig</th>
			</tr></thead>
			<tbody>${gyujto_listAllVillages()}</tbody>
		</table>
		<br><br>
		Stratégia:
		<select name="strategy">
			<option value="min">Amint kész egy gyűjtés, küldje a következőt</option>
			<option value="max">Várja meg amíg minden opció kész, és utána küldje újra</option>
		</select>
	</form>
</td></tr>`);
szem4_GYUJTO_motor();

/*-----------------🚜 NORBI0N FARMING--------------------*/
var NORBI0N_FARM_LEPES = 0;
var NORBI0N_FARM_REF;
var NORBI0N_FARM_HIBA = 0;
var NORBI0N_FARM_GHIBA = 0;
var NORBI0N_FARM_PAUSE = true;
var NORBI0N_FARM_LOOP_TIMER = null;
var NORBI0N_FARM_SHOULD_RUN = false; // NEW: Flag to control when to actually run
var NORBI0N_FARM_WAIT_COUNTER = 0; // Counter for waiting after injection
var NORBI0N_FARM_INJECTED = false; // Flag to prevent multiple injections

var SZEM4_NORBI0N_FARM = {
	OPTIONS: {
		loopInterval: 10,
		randomDelay: 3,
		loopMode: false
	},
	STATS: {
		lastRun: 0,
		totalRuns: 0
	}
};

function norbi0n_farm_isAnyModuleBusy() {
	if (!FARM_PAUSE && FARM_LEPES !== 0) return true;
	if (!EPIT_PAUSE && EPIT_LEPES !== 0) return true;
	if (!GYUJTO_PAUSE && GYUJTO_STATE !== 0) return true;
	return false;
}

function norbi0n_farm_injectFarmGod(ref) {
	try {
		const script = ref.document.createElement('script');
		script.textContent = `(function() {
			console.log('🚜 Norbi0N FarmGod automation initializing...');
			const FarmHandler = {
				farmTimer: null, totalClicks: 0, isRunning: false, isPaused: false,
				startTime: null, recheckTimeout: null,
				startFarming: function() {
					console.log('Starting continuous farming with button clicking...');
					this.isRunning = true; this.isPaused = false; this.totalClicks = 0; this.startTime = Date.now();
					const self = this;
					this.farmTimer = setInterval(() => {
						if (self.isPaused) return;
						if (self.checkBotProtection()) return;
						if (self.monitorProgress()) return;
						self.clickFarmButton();
					}, 220);
				},
				detectBotProtection: function() {
					try {
						if (document.getElementById('botprotection_quest')) return 'botprotection_quest element';
						if (document.querySelector('.bot-protection-row')) return '.bot-protection-row element';
						if (document.querySelector('.captcha')) return '.captcha element';
						const bodyText = document.body.textContent || document.body.innerText || '';
						if (bodyText.indexOf('Bot védelem') !== -1) return '"Bot védelem" text';
						if (bodyText.indexOf('Kezdd meg a botvédelem ellenőrzését') !== -1) return '"Kezdd meg a botvédelem ellenőrzését" text';
						if (bodyText.indexOf('botvédelem ellenőrzését') !== -1) return '"botvédelem ellenőrzését" text';
						if (bodyText.indexOf('Start the bot protection check') !== -1) return '"Start the bot protection check" text';
					} catch (error) {
						console.error('Error in detectBotProtection:', error);
					}
					return null;
				},
				checkBotProtection: function() {
					if (!this.isRunning) return false;
					const detectionMethod = this.detectBotProtection();
					if (detectionMethod) {
						if (!this.isPaused) {
							console.log('BOT PROTECTION DETECTED! Method: ' + detectionMethod);
							console.log('Pausing farming for 10 seconds... (captcha solver working)');
							this.isPaused = true;
							const self = this;
							this.recheckTimeout = setTimeout(() => {
								console.log('Rechecking bot protection after 10 seconds...');
								const recheckMethod = self.detectBotProtection();
								if (recheckMethod) {
									console.log('BOT PROTECTION STILL PRESENT! Method: ' + recheckMethod);
									console.log('Captcha solver failed or timeout. Stopping farming...');
									self.stopFarming();
									if (window.opener) {
										window.opener.postMessage({
											source: 'norbi_farm_bot_detection',
											message: 'Bot protection detected - farming stopped after recheck',
											detectionMethod: recheckMethod,
											totalClicks: self.totalClicks,
											timestamp: Date.now()
										}, '*');
									}
									localStorage.setItem('norbi_farm_result', JSON.stringify({
										status: 'error',
										message: 'Bot protection detected - farming stopped after recheck',
										error: 'Bot protection still present after 10 seconds',
										detectionMethod: recheckMethod,
										totalClicks: self.totalClicks,
										timestamp: Date.now()
									}));
								} else {
									console.log('BOT PROTECTION CLEARED! Captcha solver successful!');
									console.log('Resuming farming...');
									self.isPaused = false;
								}
							}, 10000);
						}
						return true;
					}
					return false;
				},
				clickFarmButton: function() {
					if (!this.isRunning) return;
					try {
						const buttonA = document.querySelector('a.farmGod_icon.farm_icon.farm_icon_a');
						const buttonB = document.querySelector('a.farmGod_icon.farm_icon.farm_icon_b');
						const button = buttonA || buttonB;
						if (button) {
							button.click();
							this.totalClicks++;
							if (this.totalClicks % 50 === 0) {
								console.log(\`Clicked farm button \${this.totalClicks} times\`);
							}
						} else {
							if (this.totalClicks % 50 === 0) {
								console.log('No farm button found, waiting...');
							}
						}
					} catch (error) {
						console.error('Error clicking farm button:', error);
					}
				},
				monitorProgress: function() {
					if (!this.isRunning) return false;
					const progressBar = document.getElementById('FarmGodProgessbar');
					if (!progressBar) return false;
					const labelSpan = progressBar.querySelector('span.label');
					if (!labelSpan) return false;
					const cleanText = labelSpan.innerText || labelSpan.textContent;
					const parts = cleanText.split(' / ');
					if (parts.length !== 2) return false;
					let currentStr = parts[0].trim().replace(/\\./g, '');
					let totalStr = parts[1].trim().replace(/\\./g, '');
					const current = parseInt(currentStr);
					const total = parseInt(totalStr);
					if (isNaN(current) || isNaN(total)) return false;
					const percentage = total > 0 ? (current / total) * 100 : 0;
					if (current >= total) {
						console.log('Farming completed!');
						this.stopFarming();
						const durationMs = Date.now() - this.startTime;
						const minutes = Math.floor(durationMs / 60000);
						const seconds = Math.floor((durationMs % 60000) / 1000);
						localStorage.setItem('norbi_farm_result', JSON.stringify({
							status: 'success',
							message: 'Farming completed successfully',
							villages: total,
							totalClicks: this.totalClicks,
							finalProgress: cleanText,
							timeMinutes: minutes,
							timeSeconds: seconds,
							timestamp: Date.now()
						}));
						setTimeout(() => window.close(), 3000);
						return true;
					}
					return false;
				},
				stopFarming: function() {
					this.isRunning = false;
					this.isPaused = false;
					if (this.farmTimer) {
						clearInterval(this.farmTimer);
						this.farmTimer = null;
					}
					if (this.recheckTimeout) {
						clearTimeout(this.recheckTimeout);
						this.recheckTimeout = null;
					}
					console.log(\`Stopped. Total clicks: \${this.totalClicks}\`);
				}
			};
			setTimeout(() => {
				if (typeof window.$ === 'undefined') {
					console.error('jQuery not available');
					localStorage.setItem('norbi_farm_result', JSON.stringify({
						status: 'error',
						message: 'jQuery not available',
						error: 'initialization_failed',
						timestamp: Date.now()
					}));
					setTimeout(() => window.close(), 2000);
					return;
				}
				window.$.getScript('https://media.innogamescdn.com/com_DS_HU/scripts/farmgod.js')
					.done(() => {
						console.log('FarmGod loaded');
						setTimeout(() => {
							const planButton = document.querySelector('input.btn.optionButton[value="Farm megtervezése"]');
							if (planButton) {
								planButton.click();
								console.log('Waiting for loading throbber to disappear...');
								function waitForThrobberToDisappear(callback) {
									const checkInterval = setInterval(() => {
										const throbber = document.querySelector('img[src="/graphic/throbber.gif"]');
										if (!throbber) {
											console.log('Throbber disappeared, loading complete!');
											clearInterval(checkInterval);
											callback();
										} else {
											console.log('Still loading... (throbber visible)');
										}
									}, 500);
									setTimeout(() => {
										clearInterval(checkInterval);
										console.log('Throbber wait timeout, continuing anyway...');
										callback();
									}, 30000);
								}
								waitForThrobberToDisappear(() => {
									console.log('Farm plan created, starting farming...');
									FarmHandler.startFarming();
								});
							} else {
								console.error('Farm button not found');
								localStorage.setItem('norbi_farm_result', JSON.stringify({
									status: 'error',
									message: 'Farm button not found',
									error: 'button_not_found',
									timestamp: Date.now()
								}));
								setTimeout(() => window.close(), 2000);
							}
						}, 2000);
					})
					.fail(() => {
						console.error('FarmGod failed to load');
						localStorage.setItem('norbi_farm_result', JSON.stringify({
							status: 'error',
							message: 'FarmGod script failed to load',
							error: 'script_load_failed',
							timestamp: Date.now()
						}));
						setTimeout(() => window.close(), 2000);
					});
			}, 3000);
			window.NorbiFarmHandler = FarmHandler;
		})();`;
		ref.document.head.appendChild(script);
		debug('Norbi0N_Farm', 'FarmGod automation injected');
		return true;
	} catch(e) { debug('Norbi0N_Farm', `Injection error: ${e}`); return false; }
}

function szem4_norbi0n_farm_motor() {
	var nexttime = 500;
	try {
		if (BOT || NORBI0N_FARM_PAUSE || USER_ACTIVITY) { nexttime = 5000; } 
		else if (norbi0n_farm_isAnyModuleBusy()) { nexttime = 3000; } 
		else {
			// Only run if explicitly triggered
			if (!NORBI0N_FARM_SHOULD_RUN) {
				nexttime = 5000; // Idle - waiting for trigger
			} else {
				debug('Norbi0N_Farm', `Motor running: SHOULD_RUN=true, LEPES=${NORBI0N_FARM_LEPES}`);
				if (NORBI0N_FARM_HIBA > 10) {
					NORBI0N_FARM_HIBA = 0; NORBI0N_FARM_GHIBA++;
					if (NORBI0N_FARM_GHIBA > 3) {
						naplo("Norbi0N_Farm", "Folyamatos hiba");
						if (NORBI0N_FARM_REF && !NORBI0N_FARM_REF.closed) NORBI0N_FARM_REF.close();
					}
					NORBI0N_FARM_LEPES = 0;
					NORBI0N_FARM_WAIT_COUNTER = 0;
					NORBI0N_FARM_INJECTED = false;
					NORBI0N_FARM_SHOULD_RUN = false;
				}
				switch (NORBI0N_FARM_LEPES) {
				case 0:
					// Open CURRENT village's farm assistant (ONCE)
					// Safety check: if window is already open and farming, don't refresh it!
					if (NORBI0N_FARM_REF && !NORBI0N_FARM_REF.closed) {
						debug('Norbi0N_Farm', 'Window already open, skipping case 0 to prevent refresh');
						NORBI0N_FARM_LEPES = 1; // Skip to next case
						break;
					}
					NORBI0N_FARM_INJECTED = false; // Reset injection flag
					const url = VILL1ST.replace("screen=overview", "screen=am_farm");
					NORBI0N_FARM_REF = windowOpener('norbi0n_farm', url, AZON + "_Norbi0N_Farm");
					debug('Norbi0N_Farm', `Opening farm assistant - SHOULD_RUN triggered`);
					NORBI0N_FARM_LEPES = 1;
					break;
				case 1:
					if (isPageLoaded(NORBI0N_FARM_REF, -1, 'screen=am_farm')) {
						NORBI0N_FARM_HIBA = 0; NORBI0N_FARM_GHIBA = 0;
						// Inject ONCE - check if already injected
						if (!NORBI0N_FARM_INJECTED && !NORBI0N_FARM_REF.NorbiFarmHandler) {
							norbi0n_farm_injectFarmGod(NORBI0N_FARM_REF);
							NORBI0N_FARM_INJECTED = true; // Mark as injected
							NORBI0N_FARM_WAIT_COUNTER = 0; // Reset counter
							debug('Norbi0N_Farm', `FarmGod injected, waiting 15 cycles (~7.5s) for initialization`);
						}
						// Wait for injection to initialize (15 cycles × 500ms = 7.5s)
						NORBI0N_FARM_WAIT_COUNTER++;
						if (NORBI0N_FARM_WAIT_COUNTER >= 15) {
							NORBI0N_FARM_REF.document.title = '🚜 Norbi0N_Farm - Running';
							naplo('Norbi0N_Farm', `🚜 FarmGod elindítva`);
							norbi0n_farm_updateUI(); // Update UI when farming starts
							NORBI0N_FARM_WAIT_COUNTER = 0;
							NORBI0N_FARM_LEPES = 2;
						}
					} else { NORBI0N_FARM_HIBA++; }
					break;
				case 2:
					if (NORBI0N_FARM_REF.closed) {
						debug('Norbi0N_Farm', 'Window closed - farm completed by user or completion');
						SZEM4_NORBI0N_FARM.STATS.lastRun = getServerTime().getTime();
						SZEM4_NORBI0N_FARM.STATS.totalRuns++;
						NORBI0N_FARM_LEPES = 0;
						NORBI0N_FARM_WAIT_COUNTER = 0;
						NORBI0N_FARM_INJECTED = false;
						NORBI0N_FARM_SHOULD_RUN = false; // Reset flag
						NORBI0N_FARM_HIBA = 0; // Reset error counter
						NORBI0N_FARM_GHIBA = 0;
						NORBI0N_FARM_REF = null; // Clear window reference
						debug('Norbi0N_Farm', `Loop mode check: ${SZEM4_NORBI0N_FARM.OPTIONS.loopMode}`);
						if (SZEM4_NORBI0N_FARM.OPTIONS.loopMode) {
							debug('Norbi0N_Farm', `✅ Loop mode ENABLED - scheduling next run`);
							norbi0n_farm_scheduleLoop();
						} else {
							debug('Norbi0N_Farm', `❌ Loop mode DISABLED - stopping`);
							norbi0n_farm_updateUI(); // Update UI when farming completes
						}
					} else {
						try {
							const result = NORBI0N_FARM_REF.localStorage.getItem('norbi_farm_result');
							if (result) {
								const data = JSON.parse(result);
								if (data.status === 'success') {
									const timeMsg = data.timeMinutes > 0 ? `${data.timeMinutes}m ${data.timeSeconds}s` : `${data.timeSeconds}s`;
									naplo('Norbi0N_Farm', `✅ Befejezve: ${data.villages} falu, ${timeMsg}, ${data.totalClicks || data.totalPresses} klikk`);
									SZEM4_NORBI0N_FARM.STATS.lastRun = getServerTime().getTime();
									SZEM4_NORBI0N_FARM.STATS.totalRuns++;
									NORBI0N_FARM_REF.localStorage.removeItem('norbi_farm_result');
									NORBI0N_FARM_LEPES = 0;
									NORBI0N_FARM_WAIT_COUNTER = 0;
									NORBI0N_FARM_INJECTED = false;
									NORBI0N_FARM_SHOULD_RUN = false; // Reset flag
									NORBI0N_FARM_HIBA = 0; // Reset error counter
									NORBI0N_FARM_GHIBA = 0;
									// Window will close automatically in 3 seconds, don't close it here
									debug('Norbi0N_Farm', `Loop mode check: ${SZEM4_NORBI0N_FARM.OPTIONS.loopMode}`);
									if (SZEM4_NORBI0N_FARM.OPTIONS.loopMode) {
										debug('Norbi0N_Farm', `✅ Loop mode ENABLED - scheduling next run`);
										norbi0n_farm_scheduleLoop();
									} else {
										debug('Norbi0N_Farm', `❌ Loop mode DISABLED - stopping`);
										norbi0n_farm_updateUI(); // Update UI when farming completes
									}
								} else if (data.status === 'error') {
									naplo('Norbi0N_Farm', `❌ Hiba: ${data.message}`);
									NORBI0N_FARM_REF.localStorage.removeItem('norbi_farm_result');

									// Handle different error types
									if (data.error === 'Bot protection quest appeared') {
										debug('Norbi0N_Farm', '🚨 Bot detected in farm tab - stopping all');
										NORBI0N_FARM_LEPES = 0;
										NORBI0N_FARM_WAIT_COUNTER = 0;
										NORBI0N_FARM_INJECTED = false;
										NORBI0N_FARM_SHOULD_RUN = false;
										NORBI0N_FARM_HIBA = 0;
										NORBI0N_FARM_GHIBA = 0;
									} else if (data.error === 'button_not_found' || data.error === 'script_load_failed' || data.error === 'initialization_failed') {
										// Initialization errors - retry after 1 minute
										debug('Norbi0N_Farm', `⚠️ Initialization error: ${data.error} - will retry in 1 minute`);
										naplo('Norbi0N_Farm', `⏳ Újrapróbálkozás 1 perc múlva...`);
										NORBI0N_FARM_LEPES = 0;
										NORBI0N_FARM_WAIT_COUNTER = 0;
										NORBI0N_FARM_INJECTED = false;
										NORBI0N_FARM_SHOULD_RUN = false;
										NORBI0N_FARM_HIBA = 0;
										NORBI0N_FARM_GHIBA = 0;

										// Schedule retry in 1 minute (or use loop if enabled)
										if (SZEM4_NORBI0N_FARM.OPTIONS.loopMode) {
											debug('Norbi0N_Farm', '🔄 Loop mode enabled - will retry on next scheduled run');
											norbi0n_farm_scheduleLoop();
										} else {
											debug('Norbi0N_Farm', '🔄 One-time retry in 1 minute');
											setTimeout(() => {
												if (NORBI0N_FARM_LEPES === 0) {
													debug('Norbi0N_Farm', '⏰ Retry timer fired');
													NORBI0N_FARM_SHOULD_RUN = true;
												}
											}, 60000);
										}
									} else {
										// Unknown error
										NORBI0N_FARM_LEPES = 0;
										NORBI0N_FARM_WAIT_COUNTER = 0;
										NORBI0N_FARM_INJECTED = false;
										NORBI0N_FARM_SHOULD_RUN = false;
										NORBI0N_FARM_HIBA = 0;
										NORBI0N_FARM_GHIBA = 0;
									}
									norbi0n_farm_updateUI(); // Update UI on error
								}
							} else {
								// No result yet - farming still in progress, reset error counter
								NORBI0N_FARM_HIBA = 0;
							}
						} catch(e) {
							// Only increment error if we can't access the window at all
							debug('Norbi0N_Farm', `Case 2 error accessing window: ${e}`);
							NORBI0N_FARM_HIBA++;
						}
					}
					break;
				default: 
					NORBI0N_FARM_LEPES = 0;
					NORBI0N_FARM_WAIT_COUNTER = 0;
					NORBI0N_FARM_INJECTED = false;
				}
			}
		}
	} catch(e) { debug('Norbi0N_Farm_motor', `ERROR: ${e}`); NORBI0N_FARM_LEPES = 0; NORBI0N_FARM_WAIT_COUNTER = 0; NORBI0N_FARM_INJECTED = false; NORBI0N_FARM_SHOULD_RUN = false; }
	var inga = 100/((Math.random()*40)+80);
	nexttime = Math.round(nexttime*inga);
	try { worker.postMessage({'id': 'norbi0n_farm', 'time': nexttime}); } 
	catch(e) { setTimeout(function(){ szem4_norbi0n_farm_motor(); }, 3000); }
}

function norbi0n_farm_scheduleLoop() {
	const interval = SZEM4_NORBI0N_FARM.OPTIONS.loopInterval;
	const randomDelay = SZEM4_NORBI0N_FARM.OPTIONS.randomDelay;
	const randomMs = (Math.random() * randomDelay * 2 - randomDelay) * 60000;
	const totalMs = (interval * 60000) + randomMs;
	const minutes = Math.round(totalMs/60000);
	const nextRunTime = new Date(Date.now() + totalMs);

	// Store next run time
	SZEM4_NORBI0N_FARM.STATS.nextRun = nextRunTime.getTime();

	naplo('Norbi0N_Farm', `🔄 Loop: következő futás ${minutes} perc múlva (${nextRunTime.toLocaleTimeString()})`);
	debug('Norbi0N_Farm', `Scheduling loop: interval=${interval}min, random=${randomDelay}min, total=${minutes}min`);

	// Clear any existing timer
	if (NORBI0N_FARM_LOOP_TIMER) {
		clearTimeout(NORBI0N_FARM_LOOP_TIMER);
		debug('Norbi0N_Farm', 'Cleared existing loop timer');
	}

	NORBI0N_FARM_LOOP_TIMER = setTimeout(() => {
		debug('Norbi0N_Farm', `⏰ Loop timer FIRED! Current LEPES: ${NORBI0N_FARM_LEPES}`);
		if (NORBI0N_FARM_LEPES !== 0) {
			debug('Norbi0N_Farm', `Loop timer fired but farming still running (LEPES=${NORBI0N_FARM_LEPES}), rescheduling...`);
			norbi0n_farm_scheduleLoop(); // Reschedule for next interval
			return;
		}
		NORBI0N_FARM_SHOULD_RUN = true; // Set flag for next run
		NORBI0N_FARM_LEPES = 0;
		debug('Norbi0N_Farm', `✅ Loop timer triggered - SHOULD_RUN = true, LEPES = 0`);
		naplo('Norbi0N_Farm', `🚜 Loop: új farmolás indítása...`);
	}, totalMs);

	norbi0n_farm_updateUI();
}

function norbi0n_farm_runNow() {
	if (!NORBI0N_FARM_PAUSE) {
		if (NORBI0N_FARM_LEPES !== 0) {
			alert2('⚠️ Norbi0N_Farming már fut! Várj amíg befejeződik!<br>Farming already running! Wait for completion!');
			return;
		}
		NORBI0N_FARM_SHOULD_RUN = true;
		NORBI0N_FARM_LEPES = 0;
		debug('Norbi0N_Farm', `Manual trigger - SHOULD_RUN set to true`);
		naplo('Norbi0N_Farm', `⚡ Manuális indítás / Manual start`);
	} else {
		alert2('⚠️ Norbi0N_Farming szünetel! Indítsd el először a ▶️ gombbal a menüben!<br>Module is paused! Start it first with ▶️ button in menu!');
	}
}

function norbi0n_farm_updateSettings() {
	const form = document.getElementById('norbi0n_farm_settings');
	const wasLoopEnabled = SZEM4_NORBI0N_FARM.OPTIONS.loopMode;

	SZEM4_NORBI0N_FARM.OPTIONS.loopInterval = parseInt(form.loopInterval.value, 10);
	SZEM4_NORBI0N_FARM.OPTIONS.randomDelay = parseInt(form.randomDelay.value, 10);
	SZEM4_NORBI0N_FARM.OPTIONS.loopMode = form.loopMode.checked;

	debug('Norbi0N_Farm', `Settings updated: Loop=${SZEM4_NORBI0N_FARM.OPTIONS.loopMode}, Interval=${SZEM4_NORBI0N_FARM.OPTIONS.loopInterval}min, Random=±${SZEM4_NORBI0N_FARM.OPTIONS.randomDelay}min`);

	// If loop was just enabled, schedule the first run
	if (!wasLoopEnabled && SZEM4_NORBI0N_FARM.OPTIONS.loopMode) {
		if (NORBI0N_FARM_LEPES === 0 && !NORBI0N_FARM_SHOULD_RUN) {
			debug('Norbi0N_Farm', '✅ Loop enabled - scheduling first run');
			norbi0n_farm_scheduleLoop();
		}
	}
	// If loop was disabled, clear timer
	else if (wasLoopEnabled && !SZEM4_NORBI0N_FARM.OPTIONS.loopMode) {
		if (NORBI0N_FARM_LOOP_TIMER) {
			clearTimeout(NORBI0N_FARM_LOOP_TIMER);
			NORBI0N_FARM_LOOP_TIMER = null;
			debug('Norbi0N_Farm', '❌ Loop disabled - timer cleared');
		}
		SZEM4_NORBI0N_FARM.STATS.nextRun = 0; // Clear next run time
	}
	// If loop is enabled and interval changed, reschedule
	else if (SZEM4_NORBI0N_FARM.OPTIONS.loopMode && NORBI0N_FARM_LOOP_TIMER) {
		debug('Norbi0N_Farm', '🔄 Interval changed - rescheduling loop');
		norbi0n_farm_scheduleLoop();
	}

	norbi0n_farm_updateUI();
}

function norbi0n_farm_updateUI() {
	// Update loop status indicator
	const loopStatusEl = document.getElementById('norbi0n_loop_status');
	const nextRunEl = document.getElementById('norbi0n_next_run');

	if (!loopStatusEl || !nextRunEl) return;

	if (SZEM4_NORBI0N_FARM.OPTIONS.loopMode) {
		if (NORBI0N_FARM_LEPES > 0) {
			// Currently farming
			loopStatusEl.innerHTML = '<b style="color:#ff8c00;">🟠 Farmolás folyamatban...</b>';
			nextRunEl.innerHTML = '---';
		} else if (SZEM4_NORBI0N_FARM.STATS.nextRun && NORBI0N_FARM_LOOP_TIMER) {
			// Scheduled for next run
			const nextTime = new Date(SZEM4_NORBI0N_FARM.STATS.nextRun);
			const now = Date.now();
			const remaining = Math.max(0, Math.ceil((SZEM4_NORBI0N_FARM.STATS.nextRun - now) / 60000));
			loopStatusEl.innerHTML = '<b style="color:#00cc00;">🟢 Loop Aktív</b>';
			nextRunEl.innerHTML = `${nextTime.toLocaleTimeString()} <i>(~${remaining} perc)</i>`;
		} else {
			// Loop enabled but not scheduled yet
			loopStatusEl.innerHTML = '<b style="color:#00cc00;">🟢 Loop Aktív</b>';
			nextRunEl.innerHTML = 'Ütemezés alatt...';
		}
	} else {
		loopStatusEl.innerHTML = '<b style="color:#999;">⚫ Loop Inaktív</b>';
		nextRunEl.innerHTML = '---';
	}
}

function norbi0n_farm_loadSettings() {
	const form = document.getElementById('norbi0n_farm_settings');
	if (!form) return;
	form.loopInterval.value = SZEM4_NORBI0N_FARM.OPTIONS.loopInterval;
	form.randomDelay.value = SZEM4_NORBI0N_FARM.OPTIONS.randomDelay;
	form.loopMode.checked = SZEM4_NORBI0N_FARM.OPTIONS.loopMode;
	if (SZEM4_NORBI0N_FARM.STATS.lastRun > 0) {
		document.getElementById('norbi0n_last_run').innerHTML = new Date(SZEM4_NORBI0N_FARM.STATS.lastRun).toLocaleString();
	}
	if (SZEM4_NORBI0N_FARM.STATS.totalRuns > 0) {
		document.getElementById('norbi0n_total_runs').innerHTML = SZEM4_NORBI0N_FARM.STATS.totalRuns;
	}
	norbi0n_farm_updateUI();
}

ujkieg_hang("Norbi0N_Farm", "norbi0n_start;norbi0n_complete");
ujkieg("norbi0n_farm", "Norbi0N Farming", `<tr><td>
	<h2 align="center">🚜 Norbi0N Farming Engine</h2>
	<p align="center"><i>A hivatalos FarmGod scriptet használja az AKTUÁLIS faluban.<br>Uses official FarmGod script on CURRENT village.</i></p>
	<p align="center"><b>🔴 Bot védelem: 7 módszer + újraellenőrzés | 🟢 Gomb kattintás: 220ms</b></p>
	<br>
	<form id="norbi0n_farm_settings" onchange="norbi0n_farm_updateSettings()">
		<table class="vis" style="margin: auto;">
			<tr><th colspan="2" style="background: #c1a264;">⚙️ Loop Beállítások</th></tr>
			<tr><td style="width: 50%;">Loop intervallum:</td><td><input type="number" name="loopInterval" min="1" max="999" value="10" size="3"> perc</td></tr>
			<tr><td>Véletlen késleltetés:</td><td>± <input type="number" name="randomDelay" min="0" max="99" value="3" size="3"> perc</td></tr>
			<tr><td><b>Loop mód:</b></td><td><input type="checkbox" name="loopMode"> Folyamatos ismétlés</td></tr>
			<tr style="background:#f4e4bc;"><td><b>Állapot:</b></td><td id="norbi0n_loop_status"><b style="color:#999;">⚫ Loop Inaktív</b></td></tr>
			<tr style="background:#f4e4bc;"><td><b>Következő futás:</b></td><td id="norbi0n_next_run">---</td></tr>
		</table>
	</form>
	<br>
	<p align="center">
		<input type="button" value="🚀 FARMOLÁS MOST! / RUN NOW!" onclick="norbi0n_farm_runNow()" style="font-size:14px; padding:10px 20px;">
	</p>
	<p align="center" style="font-size:10px; color:#666;">
		<i>1. Klikk ▶️ a menüben (modul aktiválása)<br>
		2. Loop mód BE: Automatikus futás X percenként<br>
		3. Loop mód KI: Klikk "RUN NOW!" gombra manuális futtatáshoz</i>
	</p>
	<br>
	<table class="vis" style="margin: auto;">
		<tr><th colspan="2" style="background: #c1a264;">📊 Statisztikák</th></tr>
		<tr><td style="width: 50%;">Összes futás:</td><td id="norbi0n_total_runs">0</td></tr>
		<tr><td>Utolsó futás:</td><td id="norbi0n_last_run">---</td></tr>
	</table>
</td></tr>`);

szem4_norbi0n_farm_motor();
setTimeout(() => norbi0n_farm_loadSettings(), 500);
// Periodic UI refresh every 30 seconds to update countdown
setInterval(() => {
	if (SZEM4_NORBI0N_FARM.OPTIONS.loopMode && NORBI0N_FARM_LOOP_TIMER) {
		norbi0n_farm_updateUI();
	}
}, 30000);

/*-----------------Adatmentő kezelő--------------------*/
function szem4_ADAT_saveNow(tipus) {
	let dateEl = document.querySelector(`#adat_opts input[name=${tipus}]`);
	if (dateEl) dateEl = dateEl.closest('tr').cells[2];
	switch (tipus) {
		case "farm":   localStorage.setItem(AZON+"_farm", JSON.stringify(SZEM4_FARM)); break;
		case "epit":   szem4_ADAT_epito_save(); break;
		case "vije":   localStorage.setItem(AZON+"_vije", JSON.stringify(SZEM4_VIJE)); break;
		case "sys":    localStorage.setItem(AZON+"_sys", JSON.stringify(SZEM4_SETTINGS)); break;
		case "gyujto": localStorage.setItem(AZON + '_gyujto', JSON.stringify(SZEM4_GYUJTO)); break;
		case "norbi0n_farm": localStorage.setItem(AZON + '_norbi0n_farm', JSON.stringify(SZEM4_NORBI0N_FARM)); break;
		case 'cloud':  saveLocalDataToCloud(false, false);
	}
	if (dateEl) dateEl.innerHTML = new Date().toLocaleString();
	return;
}
function szem4_ADAT_loadNow(tipus) {try{
	let dataObj = localStorage.getItem(`${AZON}_${tipus}`);
	if (!dataObj) return; else if (tipus != 'epit') dataObj = JSON.parse(dataObj);
	switch (tipus) {
		case "farm":
			SZEM4_FARM = Object.assign({}, SZEM4_FARM, dataObj);
			debug('szem4_ADAT_loadNow', 'Loading debug: FROM = ' + JSON.stringify(SZEM4_FARM.DOMINFO_FROM));
			debug('szem4_ADAT_loadNow', 'Loading debug: FROM original = ' + JSON.stringify(dataObj));
			if (Object.keys(SZEM4_FARM.DOMINFO_FROM) == 0) {
				naplo('Farm', 'Nem található a model-ben farmoló falu. Hiba? Lehet újra hozzá kell adnod.')
			}
			rebuildDOM_farm();
			break;
		case "epit": szem4_ADAT_epito_load(); break; // FIXME! MVC Hiányzik!!
		case "vije":
			SZEM4_VIJE = Object.assign({}, SZEM4_VIJE, dataObj);
			rebuildDOM_VIJE();
			break;
		case "sys":
			SZEM4_SETTINGS = Object.assign({}, SZEM4_SETTINGS, dataObj);
			loadSettings();
			break;
		case "gyujto":
			SZEM4_GYUJTO = Object.assign({}, SZEM4_GYUJTO, dataObj);
			rebuildDOM_gyujto();
			break;
		case "norbi0n_farm":
			SZEM4_NORBI0N_FARM = Object.assign({}, SZEM4_NORBI0N_FARM, dataObj);
			norbi0n_farm_loadSettings();
			break;
		default: debug('szem4_ADAT_loadNow', `Nincs ilyen típus: ${tipus}`);
	}
}catch(e) {debug('szem4_ADAT_loadNow', `Hiba ${tipus} adatbetöltésénél: ${e}`);}}

function szem4_ADAT_restart(tipus) {
	// DEL nem is kell, csak ez a reset?
	alert('To be implemented'); return;
}

/**
 * By default, all save is enabled. This function sets all to disabled
 */
function szem4_ADAT_StopAll(){
	document.querySelectorAll('#adat_opts input[type="checkbox"]').forEach(chk => {
		chk.checked = false;
	});
	return;
}

function szem4_ADAT_LoadAll(){
	ALL_EXTENSION.forEach(id => {
		try{szem4_ADAT_loadNow(id);}catch(e){console.error(e); debug('szem4_ADAT_LoadAll', 'Error ID: ' + id + ' -- ' + e)}
	});
	szem4_ADAT_loadNow('sys');
}

/** OBSOLATE, NEED REFACTOR */
function szem4_ADAT_epito_save(){try{
	var eredmeny="";
	/*Csoportok*/
	var adat=document.getElementById("epit").getElementsByTagName("table")[0].rows;
	for (var i=2;i<adat.length;i++) {
		eredmeny+=adat[i].cells[0].textContent+"-"+adat[i].cells[1].getElementsByTagName("input")[0].value;
		if (i<adat.length-1) eredmeny+=".";
	}
	
	/*Falulista*/
	eredmeny+="_";
	adat=document.getElementById("epit").getElementsByTagName("table")[1].rows;
	for (var i=1;i<adat.length;i++) {
		eredmeny+=adat[i].cells[0].textContent;
		if (i<adat.length-1) eredmeny+=".";
	}
	eredmeny+="_";
	for (var i=1;i<adat.length;i++) {
		eredmeny+=adat[i].cells[1].getElementsByTagName("select")[0].value;
		if (i<adat.length-1) eredmeny+=".";
	}
	localStorage.setItem(AZON+"_epit",eredmeny);
	/* Also save Force Farm settings */
	szem4_EPITO_saveForceFarmSettings();
	var d=new Date(); document.getElementById("adat_opts").rows[2].cells[2].textContent=d.toLocaleString();
	return;
}catch(e){debug("ADAT_epito_save",e);}}

/** OBSOLATE, NEED REFACTOR */
function szem4_ADAT_epito_load(){try{
	if(localStorage.getItem(AZON+"_epit")) var suti=localStorage.getItem(AZON+"_epit"); else return;
	/* START: Minden adat törlése a listából és falukból!*/
	var adat=document.getElementById("epit").getElementsByTagName("table")[0];
	for (var i=adat.rows.length-1;i>1;i--) {
		adat.deleteRow(i);
	}
	var adat=document.getElementById("epit").getElementsByTagName("table")[1];
	for (var i=adat.rows.length-1;i>0;i--) {
		adat.deleteRow(i);
	}
	adat=document.getElementById("epit_ujfalu_adat").getElementsByTagName("select")[0];
	while (adat.length>1) adat.remove(1);
	
	/*új csoport gomb használata, utána módosítás - ezt egyesével*/
	adat=suti.split("_")[0].split(".");
	for (var i=0;i<adat.length;i++) {
		document.getElementById("epit_ujcsopnev").value=adat[i].split("-")[0];
		szem4_EPITO_ujCsop();
		document.getElementById("epit").getElementsByTagName("table")[0].rows[i+2].cells[1].getElementsByTagName("input")[0].value=adat[i].split("-")[1];
	}
	/*Új faluk hozzáadása gomb, majd select állítása*/
	adat=suti.split("_")[1].split(".");
	document.getElementById("epit_ujfalu_adat").getElementsByTagName("input")[0].value=adat;
	szem4_EPITO_ujFalu();
	
	adat=suti.split("_")[2].split(".");
	var hely=document.getElementById("epit").getElementsByTagName("table")[1].rows;
	for (var i=0;i<adat.length;i++) {
		hely[i+1].cells[1].getElementsByTagName("select")[0].value=adat[i];
	}
	/* Also load and apply Force Farm settings */
	szem4_EPITO_loadForceFarmSettings();
	szem4_EPITO_initForceFarmUI();
	alert2("Építési adatok betöltése kész.");
	return;
}catch(e){debug("ADAT_epito_load",e);}}

function szem4_ADAT_del(tipus){try{
	if (!confirm("Biztos törli a(z) "+tipus+" összes adatát?")) return;
	if (localStorage.getItem(AZON+"_"+tipus)) {
		localStorage.removeItem(AZON+"_"+tipus);
		alert2(tipus+": Törlés sikeres");
	} else alert2(tipus+": Nincs lementett adat");
	return;
}catch(e){alert2("ADAT_epito_load HIBA\n",e);}}

function szem4_ADAT_kiir(tipus){try{
	if (localStorage.getItem(AZON+"_"+tipus)) {
		alert2("<textarea onmouseover='this.select()' onclick='this.select()' cols='38' rows='30'>"+localStorage.getItem(AZON+"_"+tipus)+"</textarea>");
	} else alert2("Nincs lementett adat");
	return;
}catch(e){debug("szem4_ADAT_kiir",e);}}

function szem4_ADAT_betolt(tipus){try{
	var beadat=prompt("Adja meg a korábban SZEM4 ÁLTAL KIÍRT ADATOT, melyet be kíván tölteni.\n\n Ne próbálj kézileg beírni ide bármit is. Helytelen adat megadását SZEM4 nem tudja kezelni, az ebből adódó működési rendellenesség csak RESET-eléssel állítható helyre.");
	if (beadat==null || beadat=="") return;
	localStorage.setItem(AZON+"_"+tipus, beadat);
	szem4_ADAT_loadNow(tipus);
	alert2("Az adatok sikeresen betöltődtek.");
}catch(e){alert2("szem4_ADAT_betolt hiba:\n" + e);}}

// Adat_FELHŐ
function loadCloudSync() {
	if (CLOUD_AUTHS) {
		try {
			CLOUD_AUTHS = JSON.parse(CLOUD_AUTHS);
			if (!CLOUD_AUTHS.authDomain || !CLOUD_AUTHS.projectId || !CLOUD_AUTHS.storageBucket || !CLOUD_AUTHS.messagingSenderId || !CLOUD_AUTHS.appId || !CLOUD_AUTHS.email || !CLOUD_AUTHS.password || !CLOUD_AUTHS.collection || !CLOUD_AUTHS.myDocument)
				throw 'Must consist these fields: authDomain projectId storageBucket messagingSenderId appId email password';
		} catch(e) { naplo('☁️ Sync', 'Invalid Auth data ' + e); }
	} else {
		return;
	}
	const script = document.createElement("script");
	script.type = "module";
	script.innerHTML = `
		import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
		import { getFirestore, collection, updateDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";
		import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js"

		const app = initializeApp(CLOUD_AUTHS);
		const db = getFirestore(app);
		const auth = getAuth();

		signInWithEmailAndPassword(auth, CLOUD_AUTHS.email, CLOUD_AUTHS.password)
		.then(async (userCredential) => {
			const user = userCredential.user;

			window.readUpData = async () => {
				const myDoc = await getDoc(doc(db, CLOUD_AUTHS.collection, CLOUD_AUTHS.myDocument));
				return myDoc.data();
			}
			window.updateData = async (newData) => {
				try {
					const myDoc = await getDoc(doc(db, CLOUD_AUTHS.collection, CLOUD_AUTHS.myDocument));
					await updateDoc(myDoc.ref, newData);
					return 'OK';
				} catch(e) {
					return 'Error: '+e;
				}
			}
			window.naplo('☁️ Sync', 'Firebase felhő kapcsolat létrejött');
			if (confirm("Firebase adatok importálása helyi adatokra?")) {
				window.loadCloudDataIntoLocal();
				window.document.querySelector('#adat_opts input[name="cloud"]').checked = true;
			} else {
				window.szem4_ADAT_LoadAll();
			}
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
		});`;
	document.head.appendChild(script);
}
function loadCloudDataIntoLocal() {
	if (!CLOUD_AUTHS) {
		alert2("Nincs aktív felhő szinkronizáció");
		return;
	}
	readUpData().then((cloudData) => {
		localStorage.setItem(AZON+"_farm",   cloudData.farm);
		localStorage.setItem(AZON+"_vije",   cloudData.vije);
		localStorage.setItem(AZON+"_epit",   cloudData.epit);
		localStorage.setItem(AZON+"_sys",    cloudData.sys);
		localStorage.setItem(AZON+"_gyujto", cloudData.gyujto);
		szem4_ADAT_LoadAll();
	});
}
function saveLocalDataToCloud(isAll, isByHand=false) {
	if (!CLOUD_AUTHS) {
		if (isByHand) alert2("Nincs aktív felhő szinkronizáció");
		return;
	}
	if (isAll) {
		ALL_EXTENSION.forEach(id => {
			if (id !== '')
			szem4_ADAT_saveNow(id);
		});
		szem4_ADAT_saveNow('sys');
	}
	var jsonToSave = {
		farm:  localStorage.getItem(AZON+"_farm"),
		epit:  localStorage.getItem(AZON+"_epit"),
		vije:  localStorage.getItem(AZON+"_vije"),
		sys:   localStorage.getItem(AZON+"_sys"),
		gyujto:localStorage.getItem(AZON+"_gyujto"),
	};
	updateData(jsonToSave).then(() => {
		var d=new Date();
		document.querySelector('#adat_opts input[name="cloud"]').closest('tr').cells[2].textContent = d.toLocaleString();
	});
}

// Adat_MOTOR
function szem4_ADAT_motor() {
	try {
		if (!ADAT_PAUSE) {
			if (ADAT_FIRST) {
				ADAT_FIRST = false;
			} else {
				document.querySelectorAll('#adat_opts input:checked').forEach((el) => {
					szem4_ADAT_saveNow(el.name);
				});
				
			}
		}
 	} catch(e) { debug('ADAT_motor', e)}
	worker.postMessage({'id': 'adatok', 'time': 60000});
}

function szem4_ADAT_AddImageRow(tipus){
	return '\
	<img title="Jelenlegi adat betöltése" alt="Betölt" onclick="szem4_ADAT_'+tipus+'_load()" width="17px" src="'+pic("load.png")+'"> \
	<img title="Törlés" alt="Töröl" onclick="szem4_ADAT_del(\''+tipus+'\')" src="'+pic("del.png")+'" width="17px""> \
	<img title="Jelenlegi adat kiiratása" alt="Export" onclick="szem4_ADAT_kiir(\''+tipus+'\')" width="17px" src="'+pic("Export.png")+'"> \
	<img title="Saját adat betöltése" alt="Import" onclick="szem4_ADAT_betolt(\''+tipus+'\')" width="17px" src="'+pic("Import.png")+'"> \
	<img title="Mentés MOST" alt="Save" onclick="szem4_ADAT_saveNow(\''+tipus+'\')" width="17px" src="'+pic("saveNow.png")+'">\
	<img title="Reset: Helyreállítás" alt="Reset" onclick="szem4_ADAT_restart(\''+tipus+'\')" width="17px" src="'+pic("reset.png")+'">';
}

ujkieg("adatok","Adatmentő",'<tr><td>\
<p align="center"><b>Figyelem!</b> Az adatmentő legelső elindításakor betölti a lementett adatokat (ha van), nem törődve azzal, hogy jelenleg mi a munkafolyamat.<br>Új adatok használatához az adatmentő indítása előtt használd a törlést a lenti táblázatból.</p>\
<form id="adatmento-form"><table class="vis" id="adat_opts" style="margin-bottom: 50px;"><tr><th>Engedélyezés</th><th style="padding-right: 20px">Kiegészítő neve</th><th style="min-width:125px; padding-right: 20px;">Utolsó mentés ideje</th><th style="width:150px">Adat kezelése</th></tr>\
<tr><td><input type="checkbox" name="farm" checked></td><td>Farmoló</td><td></td><td>'+szem4_ADAT_AddImageRow("farm")+'</td></tr>\
<tr><td><input type="checkbox" name="epit" checked></td><td>Építő</td><td></td><td>'+szem4_ADAT_AddImageRow("epit")+'</td></tr>\
<tr><td><input type="checkbox" name="vije" checked></td><td>Jelentés elemző</td><td></td><td>'+szem4_ADAT_AddImageRow("vije")+'</td></tr>\
<tr><td><input type="checkbox" name="sys" checked></td><td>Hangok, témák</td><td></td><td>'+szem4_ADAT_AddImageRow("sys")+'</td></tr>\
<tr><td><input type="checkbox" name="gyujto" checked></td><td>Gyűjtögető</td><td></td><td>'+szem4_ADAT_AddImageRow("gyujto")+'</td></tr>\
<tr><td><input type="checkbox" name="norbi0n_farm" checked></td><td>🚜 Norbi0N Farming</td><td></td><td>'+szem4_ADAT_AddImageRow("norbi0n_farm")+'</td></tr>\
<tr><td><input type="checkbox" name="cloud" unchecked></td><td><img height="17px" src="'+pic('cloud.png')+'"> Cloud sync</td><td></td><td>\
			<img title="Cloud adat betöltése a jelenlegi rendszerbe" alt="Import" onclick="loadCloudDataIntoLocal()" width="17px" src="'+pic("Import.png")+'"> \
			<img title="Local adat lementése a Cloud rendszerbe" alt="Save" onclick="saveLocalDataToCloud(true, true)" width="17px" src="'+pic("saveNow.png")+'">\
</td></tr>\
</table></form><p align="center"></p></td></tr>');
var ADAT_PAUSE=false, ADAT_FIRST = true;
szem4_ADAT_motor();
var FARM_TESZTER_TIMEOUT;

$(document).ready(function(){
	nyit("naplo");
	naplo('Globál','Verzió ['+VERZIO+'] legfrissebb állapotban, GIT-ről szedve.');
	naplo("Indulás","SZEM 4.6 elindult.");
	naplo("Indulás","Kiegészítők szünetelő módban.");
	if (TIME_ZONE != 0) naplo('🕐 Időzóna', `Időeltolódás frissítve: eltolódás ${TIME_ZONE} perccel.`);
	soundVolume(0.0);
	playSound("bot2"); /* Ha elmegy a net, tudjon csipogni */
	
	if (confirm("Engedélyezed az adatok mentését?\nKésőbb is elindíthatja, ha visszapipálja a mentés engedélyezését - ekkor szükséges kézi adatbetöltés is előtte.")) {
		if (CLOUD_AUTHS) {
			naplo("☁️ Sync","Connecting to Firebase Cloud System...");
			loadCloudSync();
		} else {
			naplo("☁️ Sync","Firebase Cloud System is not setup. Create 'szem_firebase' localStorage item with credentials");
			naplo("Adat","Adatbetöltés helyi adatokból...");
			szem4_ADAT_LoadAll();
		}
	} else {
		szem4_ADAT_StopAll();
		onWallpChange();
		// Still need to load bot notifications even if not saving data
		loadBotNotifications();
	}
	setTimeout(function(){soundVolume(1.0);},2000);
	
	$(function() {
		$("#alert2").draggable({handle: $('#alert2head')});
		$('#sugo').mouseover(function() {sugo(this,"Ez itt a súgó");});
		$('#fejresz').mouseover(function() {sugo(this,"");});
	});
	$("#farm_opts").on('change', 'input', function() {
		if (FARM_TESZTER_TIMEOUT) clearTimeout(FARM_TESZTER_TIMEOUT);
		FARM_TESZTER_TIMEOUT = setTimeout(() => shorttest(), 1000);
	});
	document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape') {
			alert2('close');
		}
	});
	document.addEventListener('click', addFreezeNotification);
	document.addEventListener('keypress', addFreezeNotification);
	addFreezeNotification();
	window.onbeforeunload = function() {return true;}

	// FARMOLÓ
	$('#farm_honnan').on('change', 'input[type="checkbox"]', (ev) => {
		const checkbox = ev.target;
		if (checkbox.getAttribute('id') == 'farm_multi_honnan') return;
		if (document.querySelector('#farm_multi_honnan').checked) {
			const unitType = checkbox.name;
			const newValue = checkbox.checked;
			for (let vill in SZEM4_FARM.DOMINFO_FROM) {
				SZEM4_FARM.DOMINFO_FROM[vill].isUnits[unitType] = newValue;
			}
		} else {
			SZEM4_FARM.DOMINFO_FROM[checkbox.closest('tr').cells[0].textContent].isUnits[checkbox.name] = checkbox.checked;
		}
	});
	// VIJE
	$('#vije_opts :input').on('change', (ev) => {
		const el = ev.target;
		if (el.type == 'text') {
			SZEM4_VIJE.i18ns[el.name] = el.value;
		} else if (el.type == 'checkbox') {
			SZEM4_VIJE.i18ns[el.name] = el.checked;
		}
	});
	addEventListener("visibilitychange", (event) => {
		if (document.visibilityState == 'visible') {
			const allVidEl = document.querySelectorAll('video');
			if (allVidEl.length > 0) allVidEl.forEach(vidEl => {vidEl.src&&vidEl.style.display!=='none'?vidEl.play():''})
		}
	});
});
/*
VIJE: Ha kék jeli van ahol nincs sereg, az tegye már "zölddé" a falut
Gyűjtő: Minimum teherbírás; minimum óránként nézzen már rá; stratégia: Maximum time-kor nézzen rá / azonnal / optimal
FEAT: Napló: "Bot védelem" bejegyzés hozzáadása
FEAT: csak 1 falura érvényes settings, falukijelölő (Beállítások [Összes] V Faluválasztás) + vizuális visszajelzés + reset (mindent ALL-ra)
EXTRA: Farm végére position-álj már egy "...további xxx falu"-t ha rejted
FEAT: VIJE_2 nem külön ref, hanem iframe a VIJE1-be!

Important addons
	FEAT: Építőbe "FASTEST()" és "ANY()" opció. Fastest: a leggyorsabban felépítülőt építi. Any: Amire van nyersed. Használható a kettő együtt, így "amire van nyersed, abból a leggyorsabban épülő"
	Teszt: ANY(FASTEST(MINES 25))

Essencial functions
	FEAT: Gyűjtő strat: Legkésőbbit várja/azonnal menjen
	FEAT: document.addEventListener() -- sync-elés gyűjtögetővel ill. VIJE-vel
	REFACT: VIJE: utolsó kémkedés IDEJÉT ne törölje már, max ha már csak pl. 3 napos v ilyesmi ~> "Ismeretlen/régi" is az legyen hogy ">3 napos". Nézi hogy ennél frissebb-e az elemzett jeli? + hogy az ELEMZETT-ek listájában nincs-e benne ugye
	ADDME: Farmok rendezése táv szerint

POCs
	REFACT: VIJE: Van olyan script ami csinál statot a jelikből, azt h csinálja? PF esetén csak? Lehetne használni, nem megnyitogatni egyesivel -> https://twscripts.dev/scripts/farmingEfficiencyCalculator.js
Téma
	FEAT: Jelszóvédett profil
	ADDME: Effect themes: Hozzuk be a havas témám a weboldalról, valamint legyen hullámzó víz a content tetején, átlátszó? egérre mozgó? https://jsfiddle.net/TjaBz/
Speedups/simplify/shadow modes
	ADDME: Sebesség ms-e leOKézáskor ne legyen érvényes, azt csinálja gyorsabban (konstans rnd(500ms)?)
UI 
	CONVERT: alert notification áthelyezése, +önmagától idővel eltűnő alertek
	FIXME: Header rész újra átdolgozása: több soros sok-kieg.-re felkészülés
	ADDME: Defibrillátor - minden script state-ét 0-ra állítja, mindent stop-ol majd elindítja a motorokat. Manuális lefejlesztés
	ADDME: [Lebegő ablak] PAUSE ALL, I'M OUT FOR [x] MINUTES
	ADDME: Új üzenet érkezett icon
	ADDME: Bejövők száma/Új bejövők száma icon
	
FEAT: Menetrend Switcher: Ne idő, hanem határszám alapú legyen. Input disabled legyen + kiírás. Határszám alapúnál legyen minimum vonatköz is, azaz pl. 10p-enkéntnél gyakrabban ne támadja	
FEAT: VIJE: "FARM" jelentést törli. Szóval ha kos v ilyesmi van, azt ne!
FEAT: VIJE: Silence mód: Csak színeket nézzen, színváltozás esetén nyissa csak a jelit (igen, így a kéket mindig)
FEAT: Scav -> $.getScript('https://gistcdn.githack.com/filipemiguel97/ba2591b1ae081c1cfdbfc2323145e331/raw/scavenging_legal.js') -> new strat? Mindig futtatni kell, ki kéne belezni
NEW FEATURE: Frissítse a bari listát: használja a birKer-t, nekünk csak egy számot kelljen megadni, hány mezőre keressen ~~ Helye: "Farmolandó falu hozzáadása" cells[2]-be 
ADDME: J? -> FAKE limit, és ennek figyelembe vétele
FEAT: Minden kiírt falu ami a tied, rátéve az egeret írja ki a nevét, és ha a csoportképzőbe csoporthoz van adva, akkor azt is!
FEAT: Ahol játékos van, azt a jelit ne törölje, hiába zöld a jelentés. 
ADDME: VIJE opciók: [] zöld kém nélküli jeliket törölje csak
FEAT: Építőbe TRAIN xx; épület, ami xx barakk és xx-5 istállót épít felváltva
NEW KIEG: Farmkezelő bot: Szimplán nézi a "Time"-ot, és ha user általa megadott időn belül van, akkor C-t nyom, ellenben meg A-t.
FEAT: Reset - Adatmentőbe hiányzó függvény. Az alap értékeket állítja be neki.

FEAT: VIJE: PF-el látni hogy van-e ott még nyers - ha csak arra vagyunk kíváncsiak akkor... use_this
FEAT: Kék hátteret a bányára menti, de elvileg nem kéne merthogy... tudjuk, nem?
NEW FEATURE: Ha egy parancs screen-jén futtatjuk SZEM-et, elemezze be azt, és vegye fel mint sereg (kellene hozzá támadásID lementés is?)

- Hang átdolgozás: Választó
ADDME: Saját falunál csatára készülés: Érjenek vissza xx:xx-re
ADDME: Fokozatos SZEM betöltés/indítás: preLoader (gyors beállítások), midLoader (mostani init()), endLoader (motorok indítása)
ADDME: szüneteltethető a falu támadása pipára mint a "J?" oszlop ~~> Ikon legyen: balta/ember + tooltip
ADDME: Minimalistic view: Karikába hogy SZEM4, alá heartbeat, listázni a szünetelt kiegeket, Sebesség/max táv infót?
NEW KIEG: Autoclicker: CSS leíró + perc + ALL/1st választó -> nyom rá click() eventeket
NEW KIEG: Auto katázó: Beadod mely faluból max hány percre, mely falukat. VIJE adatai alapján küldi, [] x+1 épületszintet feltételezve 1esével bontásra. [] előtte 2/4 kos v 2/6 kata falra
NEW KIEG: Auto kosozó: falszintenként 2 féle sereg-template, + max idő
ADDME: VIJE stat, h hány %-osan térnek vissza az egységek. Óránként resettelni!?
ADDME: Ai: Automatikus, falunkénti megbízhatóság- és hatászám számolás. Csak perc alapú, és farmvédő alapú
EXTRA: Pihenés sync: Ha Farmoló pihen, VIJE is (külön opció VIJE-nél: recommended ha zöld-törlése be van pipálva). Előbb VIJE, aztán farmolás!
ADDME: Signal-system: A főbb botok tudják egymásnak jelezni hogy ki dolgozik mikor, és ne üssék egymást, ill. tudjanak ezáltal adatot átdobni egymásnak
ADDME: Teherbírás módosító

FARMVÉDŐ (Nem kell, helyette jó a >fal nézés)
ADDME: New kieg.: FARMVÉDŐ (Farmolóba, opciókhoz)
minimum sereg definiálása falszintenként kísérő (ami kard, bárd, vagy kl lehet csak)+any.unit
FAL	MIN
0	80 lándzsa	4 kard+6 lándzsa	3 bárd+6 lándzsa	1 ló
1	8800lándzsa	300k+200 lándzsa	100b+50 lándzsa		4 kló	6 íló	(3nló)
2	32 kl	6kl+10íló
*/

void(0);
