var container, qdiv, answers = [];
var qval = 1;
var thtml = "";
var disp;
var mentioned = 1;

var lname = "quiz";

var mode = "edit";		// edit | take | results
var attempt = null;		// {order, pos, results, start, retry}
var checked = false;	// current question has been checked
var autosaveTimer = null;

var STORAGE_EDITOR = "quizzer.editor";
var STORAGE_ATTEMPT = "quizzer.attempt";

// The quiz shown when nothing has been saved yet
var SAMPLE = "(mc)\nWhich planet is closest to the Sun?\n{CHECKED}Mercury\nVenus\nEarth\nMars\n{WHY}Mercury orbits about 58 million km from the Sun, less than half of Earth's distance.\n\n"
	+ "(fitb)\nThe largest planet in the solar system is ___.\nJupiter\n{WHY}Jupiter is more than twice as massive as every other planet put together.\n"
	+ "(mc)\nHow many moons does Mars have?\n0\n1\n{CHECKED}2\n4\n{WHY}Phobos and Deimos, both discovered in 1877.\n\n"
	+ "(fitb)\nLight from the Sun takes about ___ minutes to reach Earth.\n?!(8|eight)\n{WHY}8 minutes 20 seconds on average. The answer accepts either '8' or 'eight' (the ?!( ) syntax).\n"
	+ "(mat)\nMars\nthe red planet\nSaturn\nthe brightest rings\nVenus\nthe hottest surface\nNeptune\nthe farthest planet\n{WHY}Venus is hotter than Mercury because its thick atmosphere traps heat.\n\n"
	+ "(mc)\nWhich of these is a dwarf planet?\nTitan\n{CHECKED}Pluto\nEuropa\nGanymede\n{WHY}Pluto was reclassified as a dwarf planet in 2006; the other three are moons.\n\n";

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
	
	qdiv.innerHTML = "<p id='qstuff'><button id='additem' onclick='addfitb()'>Add Fill-in-the-Blank</button> <button id='additem' onclick='addmc()'>Add Multiple Choice</button></label><button id='additem' onclick='addmat()'>Add Matching</button> <button onclick='randomize()'>Randomize</button> <button onclick='clearQuiz()'>Clear Quiz</button> <button onclick='initSpeech()'>Dictate</button><br /><button id='assemble' onclick='doquiz()'>Assemble Quiz</button><button onclick='saveFile();'>Save Quiz</button><button onclick='$(\"uquiz\").click()'>Open Quiz</button><input style='border:none;display:none;' id='uquiz' onchange='uploadquiz()' type='file' multiple /><button onclick='showPaste()'>Paste Quiz</button><button onclick='fitbtomat()'>Change FITBs to Matching</button></font></p>";
	container.innerHTML = "<p></p>";
	
	container.addEventListener("input", autosave);
	document.addEventListener("keydown", doTakeKeys);
	
	container.ondragover = dodrag;
	container.ondragleave = dodragleave;
	container.ondrop = dodrop;
	
	disp.ondragover = bdrag;
	disp.ondragleave = bdragleave;
	disp.ondrop = bdrop;
	
	doresize();
	window.onresize = doresize;
	//initSpeech();
	
	var saved = load(STORAGE_EDITOR);
	readScript(saved || SAMPLE);
	
	var pending = load(STORAGE_ATTEMPT);
	if (pending) showResume(pending);
	
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
	newel.innerHTML = "Question " + qval + "<br /><input class='fsize' placeholder='Question' onpaste='dofitbpaste(this, event)' x-webkit-speech/><br /><input class='fsize' placeholder='Answer' x-webkit-speech/><span id='qop'><br /><input class='fsize why' placeholder='Explanation (optional, shown after answering)' /><br /><button class='bremove' onclick='doRemoveEl(this)'>Remove Question</button></span>";
	container.appendChild(newel);
	
	qval++;
	container.children[container.children.length - 1].children[1].focus();
	autosave();
}

function addmc()
{
	var ans = new answer("mc");
	answers.push(ans);
	var newel = document.createElement("p");
	newel.id = "mc";
	newel.innerHTML = "Question " + qval + "<br /><input class='fsize' placeholder='Question' onpaste='dopaste(this, event)' /><br /><label><input name='op" + qval + "' type='radio' /><input class='fsize' /></label><span id='qop'><input class='fsize why' placeholder='Explanation (optional, shown after answering)' /><br /><button onclick='addmcq(this.parentElement.parentElement)'>Add Option</button><button onclick='removemcq(this.parentElement.parentElement)'>Remove Option</button><br /><button class='bremove' onclick='doRemoveEl(this)'>Remove Question</button></span>";
	container.appendChild(newel);
	
	qval++;
	container.children[container.children.length - 1].children[1].focus();
	autosave();
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
	newel.innerHTML = "Question " + qval + "<br /><label><input class='ssize' placeholder='Match' /> <input class='ssize' placeholder='Definition' /></label><br /><span id='qop'><input class='fsize why' placeholder='Explanation (optional, shown after answering)' /><br /><button onclick='addmd(this.parentElement.parentElement)'>Add Match</button><button onclick='removemd(this.parentElement.parentElement)'>Remove Match</button><br /><button class='bremove' onclick='doRemoveEl(this)'>Remove Question</button></span>";

	container.appendChild(newel);
	qval++;
	container.children[container.children.length - 1].children[1].focus();
	autosave();
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
	autosave();
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

function Key(k, d)
{
	this.value = k;
	this.def = d;
}

function why(el)
{
	var w = el.querySelector(".why");
	return w ? w.value : "";
}

// Reads the editor into answers[] (the correct answers and the text of every question)
function prepareAnswers()
{
	for (var i in answers)
	{
		var a = container.children[(+i + 1)];
		if (a == undefined) continue;
		answers[i].why = why(a);
		
		if (answers[i].type == "fitb")
		{
			answers[i].qtext = a.children[1].value;
			var v = a.children[3].value || "";
			answers[i].rvalue = v;
			answers[i].value = v.toLowerCase().replace(/ /g, "");
		}
		else if (answers[i].type == "mat")
		{
			var mats = [];
			var tdef = [];
			var ans = answers[i];
			ans.rvalue = "";
			
			for (var j = 1; j < a.children.length - 1; j++)
			{
				var tmat = a.children[j];
				if (tmat.children[1] != undefined)
				{
					mats.push(tmat.firstChild.value);
					tdef.push(tmat.children[1].value);
					
					ans.rvalue += tmat.firstChild.value + ") " + tmat.children[1].value + ", ";
				}
			}
			if (ans.rvalue != "") ans.rvalue = ans.rvalue.substring(0, ans.rvalue.length - 2);
			ans.ma = clone(mats);
			ans.mb = clone(tdef);
		}
		else
		{
			var sel = -1;
			answers[i].qtext = a.children[1].value;
			answers[i].choices = [];
			for (var j = 3; j < a.children.length - 1; j++)
			{
				var choice = a.children[j];
				if (choice.children[0] != null)
				{
					if (choice.firstChild.checked) sel = answers[i].choices.length;
					answers[i].choices.push(choice.children[1].value);
				}
			}
			
			answers[i].value = sel;
			answers[i].cvalue = (sel != -1) ? answers[i].choices[sel] : "";
		}
	}
}

function doquiz()
{
	if (answers.length == 0) return;
	thtml = gethtml();
	var script = compileScript();
	qdiv.style.display = "none";
	doresize();
	
	prepareAnswers();
	
	var order = [];
	for (var i = 0; i < answers.length; i++) order.push(i);
	attempt = {script:script, order:order, pos:0, results:[], start:Date.now(), retry:false};
	showQuestion();
}

// One question at a time
function showQuestion()
{
	mode = "take";
	checked = false;
	var i = attempt.order[attempt.pos];
	var ans = answers[i];
	var res = "<p class='qhead'>Question " + (attempt.pos + 1) + " of " + attempt.order.length + (attempt.retry ? " (retrying missed)" : "") + " &middot; " + countCorrect() + " correct</p>";
	
	if (ans.type == "fitb")
	{
		res += "<p id='fitb' class='q'>" + doreplace(ans.qtext) + "<br /><input class='qin' autocomplete='off' /></p>";
	}
	else if (ans.type == "mat")
	{
		var mats = clone(ans.ma);
		var tdef = ans.mb;
		res += "<p id='mat' class='q'>";
		
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
			res += "<input size='1' maxlength='1' class='linput' autocomplete='off' /><label>" + doreplace(mats[j]) + "</label><br />";
		
		res += "</label><label class='defs'>";
		for (var j in tdef)
		{
			if (j >= lets.length) break;
			res += "<label id='def" + lets[j] + (+i + 1) + "'>" + lets[j] + ".) " + doreplace(tdef[j]) + "</label><br />";
		}
		
		res += "</label></p>";
	}
	else
	{
		res += "<p id='mc' class='q'>" + doencode(ans.qtext) + "<br />";
		for (var j = 0; j < ans.choices.length; j++)
			res += "<label class='choice'><input type='radio' name='cop" + i + "' /><span class='num'>" + (j + 1) + "</span> " + doencode(ans.choices[j]) + "</label>";
		res += "</p>";
	}
	res += "<div id='feedback'></div>";
	res += "<p class='qnav'><button id='check' onclick='checkAnswer()'>Check</button> <button onclick='stopQuiz()'>Return to Editing Quiz</button><span class='hint'>1&ndash;9 picks a choice, enter checks and moves on</span></p>";
	container.innerHTML = res;
	container.scrollTop = 0;
	
	var q = container.children[1];
	if (ans.type == "mat") q.firstChild.firstChild.focus();
	else if (ans.type == "fitb") q.children[1].focus();
	else if (document.activeElement) document.activeElement.blur();
}

function countCorrect()
{
	var n = 0;
	for (var i in attempt.results)
		if (attempt.results[i] && attempt.results[i].correct) n++;
	return n;
}

// Grades the question element ch against answers[i]
function grade(i, ch)
{
	var correct = false;
	var cans = "";
	var sans = "";
	var unans = false;
	
	if (answers[i].type == "fitb")
	{
		var inp = ch.querySelector(".qin");
		cans = answers[i].value;
		sans = inp.value.toLowerCase().replace(/ /g, "");
		if (sans.replace(/\t|\n/g, "") == "") unans = true;
		
		var pc = parseCorrect(cans, sans);
		correct = pc.correct;
		
		cans = answers[i].rvalue.replace(/\?\!\(/g, "{choose}(");
		cans = cans.replace(/\?\?\(/g, "{option}(");
		sans = inp.value;
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
			var rval = mb[ma.indexOf(k.textContent)];
			
			var tid = "def" + l.value.toUpperCase() + (+i + 1);
			var ival = document.getElementById(tid);
			ival = (ival != undefined) ? ival.textContent.substring(4) : "";
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
		var choices = ch.querySelectorAll(".choice");
		for (var j = 0; j < choices.length; j++)
		{
			if (choices[j].firstChild.checked)
			{
				sel = j;
				break;
			}
		}
		cans = answers[i].cvalue;
		if (sel == -1) unans = true;
		else sans = answers[i].choices[sel];
		if (sel == answers[i].value) correct = true;
	}
	return {correct:correct, unans:unans, cans:cans, sans:sans};
}

function checkAnswer()
{
	if (mode != "take" || checked) return;
	var i = attempt.order[attempt.pos];
	var ch = container.children[1];
	var r = grade(i, ch);
	attempt.results[i] = r;
	checked = true;
	
	var fb = $("feedback");
	if (r.unans)
		fb.innerHTML = "<p id='unanswered'>No answer given.  The correct answer is <font color='brown'>\"" + doencode(r.cans) + "\"</font></p>";
	else if (r.correct)
		fb.innerHTML = "<p id='correct'>Correct.  The provided answer was <font color='brown'>\"" + doencode(r.sans) + "\"</font></p>";
	else
		fb.innerHTML = "<p id='incorrect'>Incorrect.  The correct answer was <font color='brown'>\"" + doencode(r.cans) + "\"</font>.  You input <font color='brown'>\"" + doencode(r.sans) + "\"</font></p>";
	if (answers[i].why)
		fb.innerHTML += "<p class='why'>" + doencode(answers[i].why) + "</p>";
	
	// lock the question and mark the right choice
	var inps = ch.getElementsByTagName("input");
	for (var j = 0; j < inps.length; j++) inps[j].disabled = true;
	if (answers[i].type == "mc")
	{
		var choices = ch.querySelectorAll(".choice");
		for (var j = 0; j < choices.length; j++)
		{
			if (j == answers[i].value) choices[j].className += " right";
			else if (choices[j].firstChild.checked) choices[j].className += " wrong";
		}
	}
	
	var b = $("check");
	b.innerHTML = (attempt.pos + 1 >= attempt.order.length) ? "See Results" : "Next";
	b.onclick = nextQuestion;
	b.focus();
	
	saveAttempt();
}

function nextQuestion()
{
	if (mode != "take" || !checked) return;
	attempt.pos++;
	if (attempt.pos >= attempt.order.length) doresults();
	else showQuestion();
}

function doTakeKeys(e)
{
	if (mode != "take" || e.ctrlKey || e.metaKey || e.altKey) return;
	var t = e.target;
	var typing = t && (t.tagName == "TEXTAREA" || (t.tagName == "INPUT" && t.type != "radio" && t.type != "checkbox"));
	
	if (e.key == "Enter")
	{
		if (t && (t.tagName == "TEXTAREA" || (t.tagName == "BUTTON" && t.id != "check"))) return;
		e.preventDefault();
		if (!checked) checkAnswer();
		else nextQuestion();
	}
	else if (e.key >= "1" && e.key <= "9" && !typing && !checked)
	{
		var i = attempt.order[attempt.pos];
		if (answers[i].type != "mc") return;
		var choices = container.children[1].querySelectorAll(".choice");
		var n = +e.key - 1;
		if (n < choices.length)
		{
			e.preventDefault();
			choices[n].firstChild.checked = true;
		}
	}
}

function stopQuiz()
{
	mode = "edit";
	attempt = null;
	forget(STORAGE_ATTEMPT);
	qdiv.style.display = "block";
	container.innerHTML = thtml;
	doresize();
}

function retake()
{
	container.innerHTML = thtml;
	doquiz();
}

function retryMissed()
{
	var missed = missedQuestions();
	if (missed.length == 0) return;
	attempt = {script:attempt.script, order:missed, pos:0, results:[], start:Date.now(), retry:true};
	showQuestion();
}

function missedQuestions()
{
	var res = [];
	for (var k = 0; k < attempt.order.length; k++)
	{
		var i = attempt.order[k];
		var r = attempt.results[i];
		if (!r || !r.correct) res.push(i);
	}
	return res;
}

function doresults()
{
	mode = "results";
	forget(STORAGE_ATTEMPT);
	var res = "";
	qdiv.style.display = "none";
	var tcor = 0;
	var outof = attempt.order.length;
	var missed = missedQuestions();
	
	for (var k = 0; k < attempt.order.length; k++)
	{
		var i = attempt.order[k];
		var r = attempt.results[i] || {unans:true, cans:"", sans:""};
		if (r.unans) outof--;
		else if (r.correct) tcor++;
	}
	
	var secs = Math.round((Date.now() - attempt.start) / 1000);
	res += "<p class='qhead'>Results" + (attempt.retry ? " (retry of missed questions)" : "") + "</p>";
	res += dograde(tcor, outof);
	res += "<p id='time'><b>Time: " + Math.floor(secs / 60) + ":" + (secs % 60 < 10 ? "0" : "") + (secs % 60) + "</b></p>";
	
	if (missed.length == 0)
		res += "<p id='correct'>Every question answered correctly.</p>";
	else
	{
		res += "<p class='qhead'>Missed</p>";
		for (var k = 0; k < missed.length; k++)
		{
			var i = missed[k];
			var r = attempt.results[i] || {unans:true, cans:"", sans:""};
			var qt = answers[i].type == "mat" ? "Matching" : answers[i].qtext;
			if (r.unans)
				res += "<p id='unanswered'>Question " + (+i + 1) + ": " + doencode(qt) + "<br />No answer given.  (The correct answer is <font color='brown'>\"" + doencode(r.cans) + "\"</font>)";
			else
				res += "<p id='incorrect'>Question " + (+i + 1) + ": " + doencode(qt) + "<br />The correct answer was <font color='brown'>\"" + doencode(r.cans) + "\"</font>.  You input <font color='brown'>\"" + doencode(r.sans) + "\"</font>";
			if (answers[i].why) res += "<br /><i>" + doencode(answers[i].why) + "</i>";
			res += "</p>";
		}
	}
	
	res += "<p class='qnav'>";
	if (missed.length > 0) res += "<button id='retry' onclick='retryMissed()'>Retry Missed Only (" + missed.length + ")</button> ";
	res += "<button onclick='retake()'>Retake Quiz</button> <button onclick='stopQuiz()'>Return to Editing Quiz</button></p>";
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
	autosave();
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
			if (why(ch)) res += "{WHY}" + why(ch) + "\n";
		}
		else if (ch.id == "mat")
		{
			res += "(mat)\n";
			for (var j = 1; j < ch.children.length - 2; j += 2)
			{
				var tch = ch.children[j];
				res += tch.firstChild.value + "\n" + tch.children[1].value + "\n";
			}
			if (why(ch)) res += "{WHY}" + why(ch) + "\n";
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
			if (why(ch)) res += "{WHY}" + why(ch) + "\n";
			res += "\n";
		}
	}
	return res;
}

// Reads a quiz in the plain-text (.qz) format or as json and adds its questions to the editor
function readScript(s)
{
	var list;
	var t = s.replace(/^\s+/, "");
	if (t.substring(0, 1) == "{" || t.substring(0, 1) == "[") list = parseJSON(t);
	else list = parseScript(s);
	
	for (var i in list)
	{
		var q = list[i];
		var ch;
		if (q.type == "mc")
		{
			addmc();
			ch = container.children[container.children.length - 1];
			ch.children[1].value = q.question || "";
			var choices = q.choices || [];
			for (var j = 0; j < choices.length; j++)
			{
				if (j > 0) addmcq(ch);
				var lab = ch.children[3 + 2 * j];
				lab.children[1].value = choices[j];
				if (j == q.answer) lab.firstChild.checked = true;
			}
		}
		else if (q.type == "mat")
		{
			addmat();
			ch = container.children[container.children.length - 1];
			var pairs = q.pairs || [];
			for (var j = 0; j < pairs.length; j++)
			{
				if (j > 0) addmd(ch);
				var lab = ch.children[1 + 2 * j];
				lab.firstChild.value = pairs[j][0];
				lab.children[1].value = pairs[j][1];
			}
		}
		else if (q.type == "fitb")
		{
			addfitb();
			ch = container.children[container.children.length - 1];
			ch.children[1].value = q.question || "";
			ch.children[3].value = q.answer || "";
		}
		else continue;
		
		if (q.explanation) ch.querySelector(".why").value = q.explanation;
	}
	autosave();
}

function isHeader(line)
{
	return line == "(mc)" || line == "(fitb)" || line == "(mat)";
}
function isWhy(line)
{
	return line.substring(0, 5) == "{WHY}";
}

function parseScript(s)
{
	var lines = s.replace(/\r/g, "").split("\n");
	var list = [];
	var i = 0;
	
	while (i < lines.length)
	{
		var line = lines[i];
		var q = null;
		
		if (line == "(fitb)")
		{
			q = {type:"fitb", question:lines[i + 1] || "", answer:lines[i + 2] || ""};
			i += 3;
		}
		else if (line == "(mc)")
		{
			q = {type:"mc", question:lines[i + 1] || "", choices:[], answer:-1};
			i += 2;
			while (i < lines.length && lines[i] != "" && !isHeader(lines[i]) && !isWhy(lines[i]))
			{
				var ts = lines[i];
				if (ts.substring(0, 9) == "{CHECKED}")
				{
					ts = ts.substring(9);
					q.answer = q.choices.length;
				}
				q.choices.push(ts);
				i++;
			}
		}
		else if (line == "(mat)")
		{
			q = {type:"mat", pairs:[]};
			i++;
			while (i < lines.length && lines[i] != "" && !isHeader(lines[i]) && !isWhy(lines[i]))
			{
				q.pairs.push([lines[i], lines[i + 1] || ""]);
				i += 2;
			}
		}
		else
		{
			i++;
			continue;
		}
		
		if (i < lines.length && isWhy(lines[i]))
		{
			q.explanation = lines[i].substring(5);
			i++;
		}
		list.push(q);
	}
	return list;
}

function parseJSON(t)
{
	var data;
	try { data = JSON.parse(t); }
	catch (e) { alert("That is not valid JSON: " + e.message); return []; }
	
	var qs = (data instanceof Array) ? data : (data.questions || []);
	if (data && data.title) lname = data.title;
	var list = [];
	
	for (var i in qs)
	{
		var q = qs[i] || {};
		var out = {type:q.type, question:q.question || q.text || "", explanation:q.explanation || q.why || ""};
		
		if (q.type == "mc")
		{
			out.choices = q.choices || q.options || [];
			out.answer = (typeof q.answer == "number") ? q.answer : out.choices.indexOf(q.answer);
		}
		else if (q.type == "mat")
		{
			out.pairs = [];
			var pairs = q.pairs || q.matches || [];
			if (pairs instanceof Array)
				for (var j in pairs)
				{
					var pr = pairs[j];
					if (pr instanceof Array) out.pairs.push([pr[0] + "", pr[1] + ""]);
					else out.pairs.push([pr.match || pr.key || "", pr.definition || pr.value || ""]);
				}
			else
				for (var k in pairs) out.pairs.push([k, pairs[k] + ""]);
		}
		else if (q.type == "fitb")
		{
			out.answer = (q.answer instanceof Array) ? "?!(" + q.answer.join("|") + ")" : (q.answer + "");
		}
		else continue;
		list.push(out);
	}
	return list;
}

function showPaste()
{
	if ($("pastebox")) return;
	var box = document.createElement("div");
	box.id = "pastebox";
	box.innerHTML = "<p>Paste a quiz in the plain-text format or as json (see README.md)</p><textarea id='pastetext' placeholder='(mc)\\nWhich planet is closest to the Sun?\\n{CHECKED}Mercury\\nVenus\\n{WHY}An explanation, optional\\n\\n(fitb)\\nThe largest planet is ___.\\nJupiter\\n'></textarea><p><label><input type='checkbox' id='pasteappend' /> add to the current quiz instead of replacing it</label></p><p><button id='assemble' onclick='loadPaste()'>Load</button> <button onclick='closePaste()'>Cancel</button></p>";
	document.body.appendChild(box);
	$("pastetext").focus();
}

function loadPaste()
{
	var t = $("pastetext").value;
	if (t.replace(/\s/g, "") == "") { closePaste(); return; }
	if (!$("pasteappend").checked) clear();
	readScript(t);
	closePaste();
}

function closePaste()
{
	var box = $("pastebox");
	if (box) document.body.removeChild(box);
}

// localStorage, all guarded: private windows and blocked storage just mean nothing is remembered
function save(key, value)
{
	try { localStorage.setItem(key, value); return true; }
	catch (e) { return false; }
}
function load(key)
{
	try { return localStorage.getItem(key); }
	catch (e) { return null; }
}
function forget(key)
{
	try { localStorage.removeItem(key); }
	catch (e) {}
}

function autosave()
{
	if (mode != "edit") return;
	if (autosaveTimer) clearTimeout(autosaveTimer);
	autosaveTimer = setTimeout(function(){
		autosaveTimer = null;
		if (mode != "edit") return;
		save(STORAGE_EDITOR, compileScript());
	}, 300);
}

function saveAttempt()
{
	if (!attempt) return;
	var a = {script:attempt.script, order:attempt.order, pos:attempt.pos + 1, results:attempt.results, start:attempt.start, retry:attempt.retry};
	if (a.pos >= a.order.length) forget(STORAGE_ATTEMPT);
	else save(STORAGE_ATTEMPT, JSON.stringify(a));
}

function showResume(json)
{
	var a;
	try { a = JSON.parse(json); }
	catch (e) { forget(STORAGE_ATTEMPT); return; }
	if (!a || !a.order || a.pos >= a.order.length) { forget(STORAGE_ATTEMPT); return; }
	
	var box = document.createElement("div");
	box.id = "resume";
	box.innerHTML = "<p>A quiz was in progress: " + a.pos + " of " + a.order.length + " answered.</p><p><button id='assemble' onclick='resumeAttempt()'>Resume</button> <button onclick='discardAttempt()'>Discard</button></p>";
	document.body.appendChild(box);
}

function resumeAttempt()
{
	var a;
	try { a = JSON.parse(load(STORAGE_ATTEMPT)); }
	catch (e) { a = null; }
	discardAttempt();
	if (!a) return;
	
	clear();
	readScript(a.script);
	thtml = gethtml();
	qdiv.style.display = "none";
	doresize();
	
	prepareAnswers();
	attempt = {script:a.script, order:a.order, pos:a.pos, results:a.results || [], start:a.start || Date.now(), retry:!!a.retry};
	showQuestion();
}

function discardAttempt()
{
	forget(STORAGE_ATTEMPT);
	var box = $("resume");
	if (box) document.body.removeChild(box);
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
