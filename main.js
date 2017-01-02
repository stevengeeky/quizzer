var container, qdiv, answers = [];
var qval = 1;
var thtml = "";
var disp;
var mentioned = 1;

var lname = "quiz";

window.onload = function()
{
	container = document.createElement("div");
	container.id = "container";
	qdiv = document.createElement("div");
	disp = document.createElement("div");
	disp.id = "disp";
	
	document.body.appendChild(disp);
	disp.appendChild(container);
	document.body.appendChild(qdiv);
	
	qdiv.innerHTML = "<p id='qstuff'><button id='additem' onclick='addfitb()'>Add Fill-in-the-Blank</button> <button id='additem' onclick='addmc()'>Add Multiple Choice</button></label><button id='additem' onclick='addmat()'>Add Matching</button> <button onclick='randomize()'>Randomize</button> <button onclick='clearQuiz()'>Clear Quiz</button> <button onclick='initSpeech()'>Dictate</button><br /><button id='assemble' onclick='doquiz()'>Assemble Quiz</button><button onclick='saveFile();'>Save Quiz</button><button onclick='$(\"uquiz\").click()'>Open Quiz</button><input style='border:none;display:none;' id='uquiz' onchange='uploadquiz()' type='file' multiple /><button onclick='fitbtomat()'>Change FITBs to Matching</button></font></p>";
	container.innerHTML = "<p></p>";
	
	container.ondragover = dodrag;
	container.ondragleave = dodragleave;
	container.ondrop = dodrop;
	
	disp.ondragover = bdrag;
	disp.ondragleave = bdragleave;
	disp.ondrop = bdrop;
	
	doresize();
	window.onresize = doresize;
	//initSpeech();
	
	//var msg = new SpeechSynthesisUtterance("Ok Google, tell me what my life story is.");
	//window.speechSynthesis.speak(msg);
}

function fitbtomat()
{
	var kmat = [];
	var dmat = [];
	
	for (var i = 0; i < container.children.length; i++)
	{
		var ch = container.children[i];
		if (ch.id == "fitb")
		{
			kmat.push(ch.children[1].value);
			dmat.push(ch.children[3].value);
			removec(findel(ch));
			i--;
		}
	}
	
	if (kmat.length > 0)
	{
		addmat();
		var ma = container.children[container.children.length - 1];
		for (var i in kmat)
		{
			var op = ma.children[ma.children.length - 3];
			op.firstChild.value = kmat[i];
			op.children[1].value = dmat[i];
			addmd(ma);
		}
		removemd(ma);
	}
}

// Speech Recognition
function initSpeech()
{
	var recognition = new webkitSpeechRecognition();
	//recognition.continuous = true;
	//recognition.interimResults = true;
	recognition.start();
	
	recognition.onresult = function(e)
	{
		for (var i = e.resultIndex; i < e.results.length; i++)
		{
			if (e.results[i].isFinal)
			{
				var res = e.results[i][0];
				var ts = res.transcript.toLowerCase();
				
				ts = ts.replace(/\bone\b/g, "1").replace(/\btwo\b/g, "2").replace(/\bthree\b/g, "3").replace(/\bfour\b/g, "4").replace(/\bfive\b/g, "5").replace(/\bsix\b/g, "6").replace(/\bseven\b/g, "7").replace(/\beight\b/g, "8").replace(/\bnine\b/g, "9");
				ts = ts.replace(/^(add|and) to/g, "add 2").replace(/^(add|and) for/g, "add 4").replace(/^(remove|delete) to/g, "remove 2").replace(/^(remove|delete) for/g, "remove 4");
				ts = ts.replace(/question to/g, "question 2").replace(/question for/g, "question 4");
				ts = ts.replace(/(the )?first question/g, "question 1").replace(/(the )?last question/g, "question " + (container.children.length - 1));
				var tsp = ts.split("and");
				
				for (var j in tsp)
				{
					var s = tsp[j];
					while (s.substring(0, 1).replace(/i| /g, "") == "") s = s.substring(1);
					s = s.replace(/^had\b/g, "add");
					
					s = s.replace(/(the |that )?(mentioned|created|side|instantiated|said|aforementioned)( question)?|\bthat question\b|\bthe question\b/g, "question " + mentioned);
					
					if (s != "")
					{
						console.log(s);
						
						if (s.replace(/(add|instantiate|create) [0-9]+ fill in the blank( questions| question)?/g, "") == "") floop(+s.match(/[0-9]+/g)[0], function(){ addfitb(); });
						if (s.replace(/(add|instantiate|create)( a| a new)? fill in the blank( question)?/g, "") == ""){ addfitb(); mentioned = container.children.length - 1; }
						
						if (s.replace(/(add|instantiate|create) [0-9]+( new)? multiple choice( questions| question)?/g, "") == "") floop(+s.match(/[0-9]+/g)[0], function(){ addmc(); });
						if (s.replace(/(add|instantiate|create)( a| a new)? multiple choice( question)?/g, "") == ""){ addmc(); mentioned = container.children.length - 1; }
						
						if (s.replace(/(remove|delete)( the)? first [0-9]+( questions)?/g, "") == "") floop(+s.match(/[0-9]+/g)[0], function(){ if (container.children.length  > 1){removec(1);} });
						if (s.replace(/(remove|delete)( the)? first( question)?/g, "") == "") if (container.children.length > 1){ removec(1); };
						if (s.replace(/(remove|delete) question( number)? [0-9]+/g, "") == "")
						{
							var tn = +s.match(/[0-9]+/g)[0];
							if (tn > 0 && tn < container.children.length) removec(tn);
						}
						
						if (s.replace(/(remove|delete)( the)? last [0-9]+( questions)?/g, "") == "") floop(+s.match(/[0-9]+/g)[0], function(){ if (container.children.length  > 1){removec(container.children.length - 1);} });
						if (s.replace(/(remove|delete)( the)? last( question)?/g, "") == "") if (container.children.length > 1){ removec(container.children.length - 1); };
						if (s.replace(/(remove|delete) all( of the questions| of questions| questions)?/g, "") == "") clearQuiz();
						
						if (s.replace(/(have|let|make|what)?(\'s)?( a)? question [0-9]+ (say|ask|asked) .*/g, "") == "")
						{
							var qn = s.match(/(say|ask|asked) .*/g)[0];
							qn = qn.substring(qn.indexOf(" ") + 1);
							var num = +s.match(/[0-9]+/g)[0];
							
							if (num > 0 && num < container.children.length)
							{
								var ch = container.children[num];
								ch.children[1].focus();
								ch.children[1].value = qn;
							}
						}
						if (s.replace(/(have|let|make|what)?(\'s)? question [0-9]+ (answer) .*/g, "") == "")
						{
							var ans = s.match(/(answer) .*/g)[0];
							ans = ans.substring(ans.indexOf(" ") + 1);
							var num = +s.match(/[0-9]+/g)[0];
							
							if (num > 0 && num < container.children.length)
							{
								var ch = container.children[num];
								if (ch.id == "fitb")
								{
									ch.children[3].focus();
									ch.children[3].value = ans;
								}
								else
								{
									ch.children[3].children[1].focus();
									ch.children[3].children[1].value = ans;
								}
							}
						}
					}
				}
			}
		}
	}
}

function floop(n, f)
{
	for (var i = 0; i < n; i++)
		f(i);
}

function doresize()
{
	var qs = document.getElementById("qstuff");
	var r = qs.getBoundingClientRect();
	
	if (qs.style.display == "none")
		container.style.top = 0;
	else
		container.style.top = r.height;
	
	if (window.innerWidth - 800 < 0)
	{
		container.style.width = window.innerWidth;
		container.style.left = 0;
	}
	else
	{
		container.style.width = 800;
		container.style.left = (window.innerWidth - 800) / 2;
	}
}

function saveFile()
{
	//tofile(\"quiz.qz\", gethtml())
	var res = compileScript();
	
	var temp = prompt("What would you like to name your quiz?", lname);
	if (temp)
	{
		lname = temp;
		tofile(lname + ".qz", res);
	}
}

function randomize()
{
	thtml = gethtml();
	container.innerHTML = thtml;
	
	for (var i = 1; i < container.children.length; i++)
	{
		var ch = container.children[i];
		var rnd = Math.ceil(Math.random() * (container.children.length - 1));
		var tel = container.children[rnd];
		swapElements(ch, tel);
		
		ch.innerHTML = "Question " + rnd + ch.innerHTML.substring(ch.innerHTML.indexOf("<br"));
		tel.innerHTML = "Question " + i + tel.innerHTML.substring(tel.innerHTML.indexOf("<br"));
		
		var tans = answers[rnd - 1];
		answers[rnd - 1] = answers[i - 1];
		answers[i - 1] = tans;
	}
}

function loganswers()
{
	var res = "";
	for (var i in answers)
		if (answers[i] != undefined)
			res += i + ") " + answers[i].type + "\n";
	console.log(res);
}

function clone(obj)
{
	var temp = obj.constructor();
	for (var i in obj)
		temp[i] = obj[i];
	return temp;
}

function swapElements(obj1, obj2) {
    var temp = document.createElement("div");
    obj1.parentNode.insertBefore(temp, obj1);
    obj2.parentNode.insertBefore(obj1, obj2);
	temp.parentNode.insertBefore(obj2, temp);
    temp.parentNode.removeChild(temp);
}

function bdrag(e)
{
	e.preventDefault();
	return false;
}

function bdragleave(e)
{
	e.preventDefault();
	return false;
}

function bdrop(e)
{
	e.preventDefault();
}

function dodragleave()
{
	container.style.background = "white";
}

function dodrag(e)
{
	e.preventDefault();
	if (qdiv.style.display == "none")
		container.style.background = "radial-gradient(#ff9020, #ff9090)";
	else
		container.style.background = "radial-gradient(white, #a0a0ff)";
}

function dodrop(e)
{
	e.preventDefault();
	container.style.background = "white";
	
	if (qdiv.style.display == "none")
		return;
	
	clear();
	var readers = [];
	
	for (var i = 0; i < e.dataTransfer.files.length; i++)
	{
		readers[i] = new FileReader();
		readers[i].readAsText(e.dataTransfer.files[i]);
		
		readers[i].onload = function()
		{
			readScript(this.result);
		}
	}
}

function addfitb()
{
	var ans = new answer("fitb");
	answers.push(ans);
	var newel = document.createElement("p");
	newel.id = "fitb";
	newel.innerHTML = "Question " + qval + "<br /><input class='fsize' placeholder='Question' onpaste='dofitbpaste(this, event)' x-webkit-speech/><br /><input class='fsize' placeholder='Answer' x-webkit-speech/><span id='qop'><button class='bremove' onclick='doRemoveEl(this)'>Remove Question</button></span>";
	container.appendChild(newel);
	
	qval++;
	container.children[container.children.length - 1].children[1].focus();
}

function addmc()
{
	var ans = new answer("mc");
	answers.push(ans);
	var newel = document.createElement("p");
	newel.id = "mc";
	newel.innerHTML = "Question " + qval + "<br /><input class='fsize' placeholder='Question' onpaste='dopaste(this, event)' /><br /><label><input name='op" + qval + "' type='radio' /><input class='fsize' /></label><span id='qop'><button onclick='addmcq(this.parentElement.parentElement)'>Add Option</button><button onclick='removemcq(this.parentElement.parentElement)'>Remove Option</button><br /><button class='bremove' onclick='doRemoveEl(this)'>Remove Question</button></span>";
	container.appendChild(newel);
	
	qval++;
	container.children[container.children.length - 1].children[1].focus();
}

function addmcq(el)
{
	var nq = document.createElement("label");
	var lc = el.children[el.children.length - 1];
	var ind = findel(el);
	
	nq.innerHTML = "<input name='op" + ind + "' type='radio' /><input class='fsize' />";
	el.insertBefore(document.createElement("br"), lc)
	el.insertBefore(nq, lc);
}

function removemcq(el)
{
	if (el.children.length == 5) return;
	el.removeChild(el.children[el.children.length - 2]);
	el.removeChild(el.children[el.children.length - 2]);
}

function addmat()
{
	var ans = new answer("mat");
	answers.push(ans);
	var newel = document.createElement("p");
	newel.id = "mat";
	newel.innerHTML = "Question " + qval + "<br /><label><input class='ssize' placeholder='Match' /> <input class='ssize' placeholder='Definition' /></label><br /><span id='qop'><button onclick='addmd(this.parentElement.parentElement)'>Add Match</button><button onclick='removemd(this.parentElement.parentElement)'>Remove Match</button><br /><button class='bremove' onclick='doRemoveEl(this)'>Remove Question</button></span>";

	container.appendChild(newel);
	qval++;
	container.children[container.children.length - 1].children[1].focus();
}

function addmd(el)
{
	var nm = document.createElement("label");
	var le = el.children[el.children.length - 1];
	nm.innerHTML = "<input class='ssize' placeholder='Match' /> <input class='ssize' placeholder='Definition' />";
	el.insertBefore(nm, le);
	el.insertBefore(document.createElement("br"), le);
}

function removemd(el)
{
	if (el.children.length == 4) return;
	el.removeChild(el.children[el.children.length - 2]);
	el.removeChild(el.children[el.children.length - 2]);
}

function findchild(parent, el)
{
	for (var i in parent.children)
	{
		var tel = parent.children[i];
		if (tel == el)
			return i;
	}
	return -1;
}

function linebefore(s, ind)
{
	var sub = s.substring(0, ind);
	var ind = 0;
	if (sub.indexOf("\n") != -1)
		ind = sub.lastIndexOf("\n");
	var ssub = sub.substring(0, ind);
	var sind = 0;
	if (ssub.indexOf("\n") != -1)
		sind = ssub.lastIndexOf("\n");
	return s.substring(ind, sind);
}
function lineafter(s, ind)
{
	var sub = s.substring(ind).split("\n", 2);
	if (sub.length == 1) sub.push("");
	return sub[1];
}
function lineat(s, ind)
{
	var ssub = s.substring(0, ind);
	var esub = s.substring(ind);
	var sind = 0;
	if (ssub.indexOf("\n") != -1)
		sind = ssub.lastIndexOf("\n");
	var eind = esub.length;
	if (esub.indexOf("\n") != -1)
		eind = esub.indexOf("\n");
	eind += ind;
	return s.substring(sind, eind);
}


function dofitbpaste(el, e)
{
	var t = e.clipboardData.getData("Text");
	
	t = t.replace(/\r/g, "");
	while (t.indexOf("\n\n") != -1) t = t.replace(/\n\n/g, "\n");
	while (t.substring(t.length - 1, t.length) == "\n") t = t.substring(0, t.length - 1);
	
	var ts = t.split("\n");
	var tel = el.parentElement;
	
	if (ts && ts[0].indexOf("\t") != -1)
	{
		e.preventDefault();
		for (var i in ts)
		{
			addfitb();
			tel = tel.nextSibling;
			
			var li = ts[i];
			var fs = li.substring(0, li.indexOf("\t"));
			var ss = li.substring(li.lastIndexOf("\t") + 1);
			
			if (ss.indexOf(";") != -1)
			{
				ss = "?!(" + ss + ")";
				ss = ss.replace(/\; |\;/g, "|");
			}
			ss = ss.replace(/\ba\b/g, "??(a)"); ss = ss.replace(/\ban\b/g, "??(an)");
			
			ss = ss.replace(/\(to\b/g, "(??(to)"); ss = ss.replace(/\|to\b/g, "|??(to)");
			ss = ss.replace(/^to\b/g, "??(to)");
			
			tel.children[1].value = fs;
			tel.children[3].value = ss;
		}
		removec(1);
		
		container.children[container.children.length - 1].children[3].focus();
	}
}

function dopaste(el, e)
{
	var t = e.clipboardData.getData("Text");
	
	t = t.replace(/\r/g, "");
	while (t.indexOf("\n\n") != -1) t = t.replace(/\n\n/g, "\n");
	while (t.substring(t.length - 1, t.length) == "\n") t = t.substring(0, t.length - 1);
	
	if (t.indexOf("A)") != -1)
	{
		var pel = el.parentElement;
		var tnd = findchild(container, pel);
		e.preventDefault();
		var tcount = 0;
		
		while (t.indexOf("A)") != -1)
		{
			tcount++;
			if (pel.id == "mc")
			{
				var ind = t.indexOf("A)");
				var qu = linebefore(t, ind);
				pel.children[1].value = qu;
				
				var text = "ABCD";
				var last = qu;
				var tind;
				
				for (var i = 1; i <= 4; i++)
				{
					var rind = tind;
					tind = t.indexOf(text[(i - 1)] + ")");
					if (linebefore(t, tind) != last)
					{
						tind = rind;
						break;
					}
					last = lineat(t, tind);
					pel.children[(1 + 2 * i)].children[1].value = last;
				}
				t = t.substring(tind + last.length);
			}
			tnd++;
			
			if (tnd >= container.children.length) addmc();
			pel = pel.nextSibling;
		}
		if (tcount >= 1)
			removec(container.children.length - 1);
		container.children[container.children.length - 1].children[1].focus();
	}
}

function addquestion()
{
	if ($("atype").value == "Fill-In-The-Blank")
		addfitb();
	else
		addmc();
}

function findel(el)
{
	for (var i in container.children)
	{
		if (container.children[i].outerHTML == el.outerHTML)
			return i;
	}
	return -1;
}

function doRemoveEl(el)
{
	var pel = el.parentElement.parentElement;
	var ind = findel(pel);
	removec(ind);
}

function removec(i)
{
	thtml = gethtml();
	container.innerHTML = thtml;
	var tel = container.children[i];
	
	container.removeChild(tel);
	answers.splice(i - 1, 1);
	qval--;
	
	for (var j = i; j < container.children.length; j++)
	{
		var ih = container.children[j].innerHTML;
		container.children[j].innerHTML = "Question " + (j) + ih.substring(ih.indexOf("<br"));
	}
}

function doreplace(s)
{
	return doencode(s);
}

function doencode(s)
{
	var res = "";
	for (var i in s)
		res += "&#" + ascii(s[i]) + ";";
	return res;
}

function ascii(s)
{
	return s.charCodeAt(0);
}

function doQkeyDown(e, el)
{
	var fc = +findchild(container, el.parentElement);
	var pel = el.parentElement;
	if (e.keyCode == 13)
	{
		if (e.ctrlKey) doresults();
		else if (e.shiftKey && pel.previousSibling && pel.previousSibling.id == "fitb") pel.previousSibling.children[2].focus();
		else if (pel.nextSibling.id.replace(/fitb|mc|mat/g, "") == pel.nextSibling.id) doresults();
		else if (!e.shiftKey && pel.nextSibling.id == "fitb") pel.nextSibling.children[2].focus();
	}
}

function Key(k, d)
{
	this.value = k;
	this.def = d;
}

function doquiz()
{
	if (answers.length == 0) return;
	var res = "";
	thtml = gethtml();
	qdiv.style.display = "none";
	doresize();
	
	for (var i in answers)
	{
		var a = container.children[(+i + 1)];
		if (answers[i].type == "fitb" && a != undefined)
		{
			res += "<p id='fitb'>Question " + (+i + 1) + "<br />" + doreplace(a.children[1].value) + "<br /><input onkeydown='doQkeyDown(event, this);' /></p>";
			var v = a.children[3].value || "";
			answers[i].rvalue = v;
			answers[i].value = v.toLowerCase().replace(/ /g, "");
		}
		else if (answers[i].type == "mat" && a != undefined)
		{
			res += "<p id='mat'>";
			var keys = [];
			var mats = [];
			var tdef = [];
			var ans = answers[i];
			ans.rvalue = "";
			
			for (var j = 1; j < a.children.length - 1; j++)
			{
				var tmat = a.children[j];
				if (tmat.children[1] != undefined)
				{
					keys.push(new Key(tmat.firstChild.value, tmat.children[1].value));
					mats.push(tmat.firstChild.value);
					tdef.push(tmat.children[1].value);
					
					ans.rvalue += tmat.firstChild.value + ") " + tmat.children[1].value + ", ";
				}
				if (ans.rvalue != "") ans.rvalue = ans.rvalue.substring(0, ans.rvalue.length - 2);
			}
			ans.ma = clone(mats);
			ans.mb = clone(tdef);
			
			for (var j = 0; j < mats.length; j++)
			{
				var temp = mats[j];
				var rswitch = Math.floor(Math.random() * mats.length);
				mats[j] = mats[rswitch];
				mats[rswitch] = temp;
			}
			res += "<label class='keys'>";
			var lets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			for (var j in mats)
				res += "<input size='1' maxlength='1' class='linput' /><label>" + doreplace(mats[j]) + "</label><br />";
			
			res += "</label><label class='defs'>";
			for (var j in tdef)
			{
				if (j >= lets.length) break;
				res += "<label id='def" + lets[j] + (+i + 1) + "'>" + lets[j] + ".) " + doreplace(tdef[j]) + "</label><br />";
			}
			
			res += "</label></p>";
		}
		else if (a != undefined)
		{
			var sel = -1;
			res += "<p id='mc'>Question " + (+i + 1) + "<br />" + doencode(a.children[1].value) + "<br />";
			for (var j = 3; j < a.children.length - 1; j++)
			{
				var choice = a.children[j];
				if (choice.children[0] != null) 
				{
					if (choice.firstChild.checked) sel = j - 3;
					res += "<label><input type='radio' name='cop" + i + "' />" + doencode(choice.children[1].value) + "</label><br />";
				}
			}
			
			answers[i].value = sel;
			if (sel != -1) answers[i].cvalue = a.children[sel + 3].children[1].value;
			res += "</p>";
		}
	}
	res += "<button onclick='doresults()'>Show Results</button> <button onclick='qdiv.style.display = \"block\";container.innerHTML = thtml;doresize();'>Return to Editing Quiz</button>";
	container.innerHTML = res;
	container.scrollTop = 0;
	var fc = container.firstChild;
	
	if (fc.id == "mat") fc.firstChild.firstChild.focus();
	else fc.children[2].focus();
}

function doresults()
{
	var res = "";
	qdiv.style.display = "none";
	var tcor = 0;
	var outof = +answers.length;
	
	for (var i in container.children)
	{
		if (i >= answers.length)
			break;
		var ch = container.children[i];
		
		var correct = false;
		var cans = "";
		var sans = "";
		var unans = false;
		
		if (answers[i].type == "fitb" && ch.children[2] != undefined)
		{
			cans = answers[i].value;
			sans = ch.children[2].value.toLowerCase().replace(/ /g, "");
			if (sans.replace(/\t|\n/g, "") == "") unans = true;
			
			var pc = parseCorrect(cans, sans);
			cans = pc.cans;
			sans = pc.sans;
			correct = pc.correct;
			
			cans = answers[i].rvalue.replace(/\?\!\(/g, "{choose}(");
			cans = cans.replace(/\?\?\(/g, "{option}(");
			sans = ch.children[2].value;
		}
		else if (answers[i].type == "mat")
		{
			var ma = answers[i].ma;
			var mb = answers[i].mb;
			var tch = ch.firstChild;
			correct = true;
			unans = true;
			
			for (var j = 1; j < tch.children.length; j += 3)
			{
				var k = tch.children[j];
				var l = tch.children[j - 1];
				var rval = mb[ma.indexOf(k.innerHTML)];
				
				var tid = "def" + l.value.toUpperCase() + (+i + 1);
				var ival = document.getElementById(tid);
				ival = (ival != undefined) ? ival.innerHTML.substring(4) : "";
				if (ival != "") unans = false;
				
				if (ival != rval) correct = false;
				sans += "'" + ival + "', ";
				cans += "'" + rval + "', ";
			}
			if (sans.length > 0)
			{
				sans = sans.substring(0, sans.length - 2);
				cans = cans.substring(0, cans.length - 2);
			}
		}
		else
		{
			var sel = -1;
			for (var j = 2; j < ch.children.length; j++)
			{
				var choice = ch.children[j];
				if (choice.children[0] != null) 
				{
					if (choice.firstChild.checked)
					{
						sel = j - 2;
						break;
					}
				}
			}
			cans = answers[i].cvalue;
			if (ch.children[sel + 2] != undefined)
				sans = ch.children[sel + 2].innerHTML.replace(/<.*?>/g, "");
			else
				break;
			if (sel == -1) unans = true;
			if (sel == answers[i].value) correct = true;
		}
		
		if (unans)
		{
			res += "<p id='unanswered'>Question " + (+i + 1) + " does not have an answer.  (The correct answer is <font color='brown'>\"" + doencode(cans) + "\"</font>)</p>";
			outof--;
		}
		else if (correct)
		{
			res += "<p id='correct'>Question " + (+i + 1) + " is correct.  The provided answer was <font color='brown'>\"" + doencode(sans) + "\"</font></p>";
			tcor++;
		}
		else
			res += "<p id='incorrect'>Question " + (+i + 1) + " is incorrect.  The correct answer was <font color='brown'>\"" + doencode(cans) + "\"</font>.  You input <font color='brown'>\"" + doencode(sans) + "\"</font></p>";
	}
	res += dograde(tcor, outof) + "<button onclick='container.innerHTML = thtml;doquiz();'>Retake Quiz</button> <button onclick='qdiv.style.display = \"block\";container.innerHTML = thtml;doresize();'>Return to Editing Quiz</button>";
	container.innerHTML = res;
	container.scrollTop = 0;
}

function dograde(tc, of)
{
	var res = "<p id='grade'><b>Percentage: ", pc;
	
	if (tc == 0 && of == 0)
	{
		tc = 1;
		of = 1;
	}
	pc = (tc / of) * 100;
	
	res += Math.round(pc * 1000) / 1000 + "% (" + tc + " / " + of + ")</b><br /><b>Grade: ";
	var tr = "F";
	
	if (pc == 100) tr = "A+";
	else if (pc > 93) tr = "A";
	else if (pc > 89) tr = "A-";
	else if (pc > 86) tr = "B+";
	else if (pc > 83) tr = "B";
	else if (pc > 79) tr = "B-";
	else if (pc > 76) tr = "C+";
	else if (pc > 73) tr = "C";
	else if (pc > 69) tr = "C-";
	else if (pc > 66) tr = "D+";
	else if (pc > 63) tr = "D";
	else if (pc > 59) tr = "D-";
	
	res += tr + "</b></p>";
	return res;
}

function asplit(s)
{
	var res = [];
	var mas = matches(s, /\|/g);
	var last = 0;
	
	for (var i in mas)
	{
		var ma = mas[i];
		var fs = s.substring(0, ma.index);
		var ss = s.substring(ma.index + 1);
		
		if (fs.indexOf("(") == -1 && fs.indexOf(")") == -1 || fs.lastIndexOf(")") > fs.lastIndexOf("(") && fs.indexOf("(") != -1)
		{
			if (ss.indexOf("(") < ss.indexOf(")") && ss.indexOf("(") != -1 || ss.indexOf(")") == -1 && ss.indexOf("(") == -1)
			{
				res.push(s.substring(last, ma.index));
				last = ma.index + 1;
			}
		}
	}
	res.push(s.substring(last));
	return res;
}

function simplify(s)	// Used to correct multi-dimensional options
{
	if (s.indexOf("??(") != -1 && s.indexOf("??(") < s.indexOf("?!(") || s.indexOf("?!(") == -1 && s.indexOf("??(") != -1)
	{
		var sp = s.indexOf("??(");
		var ep = endparen(s.substring(sp)) + sp;
		var tsub = s.substring(sp + 3, ep);
		tsub = simplify(tsub);
		
		var asp = tsub.split("|");
		var ts = s.substring(0, sp) + s.substring(ep + 1);
		
		for (var i in asp)
		{
			var tas = asp[i];
			ts += "|" + s.substring(0, sp) + tas + s.substring(ep + 1);
		}
		
		if (ts.substring(0, 1) == "|") ts = ts.substring(1);
		return ts;
	}
	else if (s.indexOf("?!(") != -1 && s.indexOf("?!(") < s.indexOf("??(") || s.indexOf("??(") == -1 && s.indexOf("?!(") != -1)
	{
		var sp = s.indexOf("?!(");
		var ep = endparen(s.substring(sp)) + sp;
		var tsub = s.substring(sp + 3, ep);
		tsub = simplify(tsub);
		
		var asp = tsub.split("|");
		var ts = "";
		
		for (var i in asp)
		{
			var tas = asp[i];
			ts += "|" + s.substring(0, sp) + tas + s.substring(ep + 1);
		}
		
		if (ts.substring(0, 1) == "|") ts = ts.substring(1);
		return ts;
	}
	else
		return s;
}

function ssort(ar)
{
	var ch = false;
	for (var i = 0; i < ar.length - 1; i++)
	{
		var a = ar[i];
		var b = ar[i + 1];
		if (b.length > a.length)
		{
			ar[i] = b;
			ar[i + 1] = a;
			ch = true;
		}
	}
	if (ch) return ssort(ar);
	else return ar;
}

function parseCorrect(cans, sans)
{
	var dc = true;
	var tcorrect = false;
	var sind, ssub, ep, psub, spsub, tsub;
	
	while (cans.indexOf("??(") != -1 || cans.indexOf("?!(") != -1)
	{
		if (cans.indexOf("??(") < cans.indexOf("?!(") && cans.indexOf("??(") != -1 || cans.indexOf("?!") == -1)
		{
			sind = cans.indexOf("??(");
			ssub = cans.substring(sind);
			ep = endparen(ssub) + sind;
			
			psub = cans.substring(sind + 3, ep);
			
			while (psub.indexOf("??(") != -1 || psub.indexOf("?!(") != -1)
			{
				var ap = asplit(psub);
				for (var i in ap)
				{
					ap[i] = simplify(ap[i]);
				}
				psub = ap.join("|");
			}
			
			spsub = ssort(psub.split("|"));
			
			for (var j in spsub)
			{
				tsub = spsub[j];
				
				if (sans.substring(sind, sind + tsub.length) == tsub)
				{
					sans = sans.substring(0, sind) + sans.substring(sind + tsub.length);
					break;
				}
			}
			
			cans = cans.substring(0, sind) + cans.substring(ep + 1);
		}
		else
		{
			sind = cans.indexOf("?!(");
			ssub = cans.substring(sind);
			ep = endparen(ssub) + sind;
			
			psub = cans.substring(sind + 3, ep);
			while (psub.indexOf("??(") != -1 || psub.indexOf("?!(") != -1)
			{
				var ap = asplit(psub);
				for (var i in ap)
				{
					ap[i] = simplify(ap[i]);
				}
				psub = ap.join("|");
			}
			
			spsub = ssort(psub.split("|"));
			dc = false;
			
			for (var j in spsub)
			{
				tsub = spsub[j];
				if (sans.substring(sind, sind + tsub.length) == tsub)
				{
					sans = sans.substring(0, sind) + sans.substring(sind + tsub.length);
					dc = true;
					break;
				}
			}
			
			cans = cans.substring(0, sind) + cans.substring(ep + 1);
			if (!dc) break;
		}
	}
	
	if (dc)
	{
		if (cans == sans)
			tcorrect = true;
	}
	else
		tcorrect = false;
	
	return {cans:cans,sans:sans,correct:tcorrect};
}

function gethtml()
{
	var inps = document.getElementsByTagName("input");
	for (var i in inps)
	{
		var inp = inps[i];
		if (typeof inp != "number" && typeof inp != "function")
		{
			var oi = inp.outerHTML;
			var it = "";
			if (inp.checked) it = "checked";
			
			var es = endsign(oi);
			var itag = oi.substring(0, es);
			
			if (itag.indexOf("value") != -1)
			{
				oi = oi.substring(0, oi.indexOf("value")) + oi.substring(es);
				es = endsign(oi);
			}
			inp.outerHTML = oi.substring(0, es) + " value=\"" + doreplace(inp.value) + "\" " + it + oi.substring(es);
		}
	}
	var temp = "" + container.innerHTML;
	return temp;
}

function endsign(s)
{
	var sp = 0;
	var ep = 0;
	
	var ms = matches(s, /\".*?\"|<|>/g);
	for (var i in ms)
	{
		var m = ms[i];
		if (m.value == "<")
			sp++;
		else if (m.value == ">")
			ep++;
		
		if (sp == ep)
			return m.index;
	}
	return -1;
}

function matches(s, r)
{
	var res = [];
	var temp;
	while ((temp = r.exec(s)) != null)
	{
		res.push(new match(temp[0], temp.index));
	}
	return res;
}

function match(value, index)
{
	this.value = value;
	this.index = index;
}

function clearQuiz()
{
	if (container.children.length > 1 && confirm("Are you sure you would like to completely clear this quiz?"))
		clear();
}

function clear()
{
	while (container.children.length > 1)
		container.removeChild(container.children[1]);
	qval = 1;
	answers = [];
}

function compileScript()
{
	var res = "";
	
	for (var i = 1; i < container.children.length; i++)
	{
		var ch = container.children[i];
		if (ch.id == "fitb")
		{
			res += "(fitb)\n" + ch.children[1].value + "\n" + ch.children[3].value + "\n";
		}
		else if (ch.id == "mat")
		{
			res += "(mat)\n";
			for (var j = 1; j < ch.children.length - 2; j += 2)
			{
				var tch = ch.children[j];
				res += tch.firstChild.value + "\n" + tch.children[1].value + "\n";
			}
			res += "\n";
		}
		else
		{
			res += "(mc)\n" + ch.children[1].value + "\n";
			for (var j = 3; j < ch.children.length - 1; j += 2)
			{
				var tch = ch.children[j];
				
				if (tch.firstChild.checked) res += "{CHECKED}" + tch.children[1].value + "\n";
				else res += tch.children[1].value + "\n";
			}
			res += "\n";
		}
	}
	return res;
}

function readScript(s)
{
	while (s.substring(s.length - 3) == "\n\n\n") s = s.substring(0, s.length - 1);
	while (s.replace(/\(ma\)|\(fitb\)|\(mat\)/g, "") != s)
	{
		var sps = s.split("\n");
		var ovt = 0;
		var sm = s.match(/\(mc\)|\(fitb\)|\(mat\)/g)[0];
		
		if (sm == "(mc)")
		{
			addmc();
			var si = sps.indexOf("(mc)");
			ovt = si + 5;
			
			var ch = container.children[container.children.length - 1];
			ch.children[1].value = sps[si + 1];
			var spn = sps.indexOf("", si);
			
			for (var i = 3; i <= 2 * (spn - si); i += 2)
			{
				if (i > 3) addmcq(ch);
				var ts = sps[si + (i + 1) / 2];
				ovt += ts.length + 1;
				
				if (ts.substring(0, 9) == "{CHECKED}")
				{
					ts = ts.substring(9);
					ch.children[i].firstChild.checked = true;
				}
				ch.children[i].children[1].value = ts;
			}
			removemcq(ch);
			removemcq(ch);
		}
		else if (sm == "(mat)")
		{
			addmat();
			var si = sps.indexOf("(mat)");
			ovt = si + 6;
			
			var ch = container.children[container.children.length - 1];
			var spn = sps.indexOf("", si);
			
			for (var i = 0; i < spn - si; i += 2)
			{
				var tch = ch.children[ch.children.length - 3];
				addmd(ch);
				
				tch.firstChild.value = sps[si + i + 1];
				tch.children[1].value = sps[si + i + 2];
				ovt += sps[si + i + 1].length + sps[si + i + 2].length + 2;
			}
			removemd(ch);
			removemd(ch);
		}
		else if (sm == "(fitb)")
		{
			addfitb();
			var si = sps.indexOf("(fitb)");
			ovt = sps[si + 1].length + sps[si + 2].length + 9;
			
			var tch = container.children[container.children.length - 1];
			tch.children[1].value = sps[si + 1];
			tch.children[3].value = sps[si + 2];
		}
		s = s.substring(ovt);
	}
}

function tofile(title, text)
{
	var a = document.createElement("a");
	document.body.appendChild(a);
	a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	a.setAttribute("download", title);
	a.click();
	document.body.removeChild(a);
}

function $(id)
{
	return document.getElementById(id);
}

function uploadquiz()
{
	clear();
	doupload();
}

function doupload()
{
	var readers = [];
	for (var i = 0; i < $("uquiz").files.length; i++)
	{
		var file = $("uquiz").files[i];
		readers[i] = new FileReader();
		
		readers[i].readAsText(file);
		readers[i].onload = function(){
			var res = this.result;
			readScript(res);
		}
	}
}

function endparen(s)
{
	var mas = matches(s, /\(|\)/g);
	var sp = 0, ep = 0;
	
	for (var i in mas)
	{
		var ma = mas[i];
		if (ma.value == "(") sp++;
		else ep++;
		
		if (sp == ep) return ma.index;
	}
	return -1;
}

function answer(ty)
{
	this.type = ty;
}