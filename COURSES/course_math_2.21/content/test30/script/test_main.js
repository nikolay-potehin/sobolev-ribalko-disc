//Authors: alexkat, I.G.
//version: 3.04
//date: 12.01.2009

var itsIE=Browser.Engine.trident;
var itsIE6=itsIE && Browser.Engine.version==4;
var answerTypes = [];
var testapi = function(){return testapi;}();
var rightAnswers = function(){return rightAnswers;}();
var Settings = function(){return Settings;}();
var ServiceExchange = function(){return ServiceExchange;}();

var CooCounter={
	inited:false,
	cookName:"mark",
	mins:30,
	init:function(){
		var guid;
		var res;
		if($("test_block"))
		{
			var blocks=document.body.getsById("test_block");
			blocks.each(function(item){
				guid=item.getProperty("guid");
				res+= guid ? guid : item.innerHTML;
			});
			res=TestHash.encode(TestHash.stringHashToInt(res),0);
		}
		else
		{
			var part=document.body.getElementById("questions");
			if(part){
				guid=part.getProperty("guid");
				res = guid ? guid : TestHash.encode(TestHash.stringHashToInt(part.innerHTML),0);
			}
			else return;
		}
		this.inited=true;
		this.cookName += res;
		this.setCookie((new Date()).getTime().toString()+this.cookName, "0", this.expDate());
	},
	expDate:function()
	{
		var dateObj=new Date();
		dateObj.setTime(this.mins*60000+dateObj.getTime());
		return dateObj;
	},
	countCookie:function()
	{
		var arr=document.cookie.split(";");
		var count=0;
		for(var j=0;j<arr.length;j++)
			if(arr[j].indexOf(this.cookName)!=-1)
				count++;
		return count;
	},
	setCookie:function(name,value,expires) {
		document.cookie = name + "=" +
		encodeURIComponent (value) +
		((expires) ? "; expires=" + expires.toGMTString() : "");
	}
}

var Selecting = {
	answers:null,
	map:null,
	blocked:false,
	init:function(){
		if($("test_block"))
			this.blocked=true;
		if($defined(testapi) && (testapi.blocks || testapi.selection))
			this.classify(document.body.getsById('answer'));
	},
	classify:function(answers){
		var buf=new $H();
		var points;
		if(this.blocked){
			document.body.getsById("test_block").each(function(block, i){
				block.getsById("answer").each(function(ans){
						ans.blockNum = i;
					})
				});
			var tmp;
			answers.each(function(answer, j){
				if($chk(answer.blockNum)){
					if(!buf.has(answer.blockNum))
						buf.set(answer.blockNum, new Hash());
					tmp=buf.get(answer.blockNum);
					points = parseInt($(answer).getElement('span[id=points]').innerHTML);
					if(tmp.has(points))
						tmp.get(points).include(j);
					else
						tmp.set(points,[j]);
				}
			});
		}
		else{
			answers.each(function(answer, ind){
				points = parseInt(answer.getElement('span[id=points]').innerHTML);
				if(buf.has(points))
					buf.get(points).include(ind);
				else
					buf.set(points,[ind]);
			});
		}

		/*
		//-----<<--
		var str="";
		buf.each(function(value, key){
			str+="\nBlock "+key;
			value.each(function(value, key){
				str+="\n\tPoints "+key+"\n\t\tquests #"+value;
			});
		}); 
		alert("Hash\n"+str);
		//----->>--
		*/

		this.answers=answers;
		this.map=buf;
	},
	getAnswers:function(selection){
		var tmp=this.map;
		var a=this.answers;
		var res=[];
		var num;
		if($type(selection[0][0])=="array")
		{
			selection.each(function(block, j){
				if (tmp.has(j)) {
					var bl = tmp.get(j);
					block.each(function(item){
						for (var k = 0; k < item[1]; k++)
							if (bl.has(item[0]) && bl.get(item[0]).length > 0) {
								num = bl.get(item[0]).getRandom();
								res.push(a[num]);
								bl.get(item[0]).erase(num);
							}
					});
				}
			});
		}
		else
		{
			if (this.blocked) {
				var h = new $H();
				tmp.each(function(map,block){
					map.each(function(ans,point){
						if (h.has(point)) 
							h.get(point).combine(ans);
						else 
							h.set(point, ans);
					});
				});
				tmp = h;
			/*
				var str=""; 
				tmp.each(function(value, key){
					str+="\nPoints "+key+"\n\t\tquests #"+value;
				}); 
				alert("reordered\n"+str);
			*/
			}
			selection.each(function(item){
				for (var k = 0; k < item[1]; k++) {
					if (tmp.has(item[0]) && tmp.get(item[0]).length > 0) {
						num = tmp.get(item[0]).getRandom();
						res.push(a[num]);
						tmp.get(item[0]).erase(num);
					}
				}
			});
		}

		return res;
	}
}

var Timer = {
	initialize: function(time){
		if ($type(time)=="number" && time > 0) {
			this.finishTime = time + this.dateToSec(new Date());
			OnEnd.add(function(){$clear(Timer.timer)},true);
			window.setTimeout("Timer.tick()", 2000);
		}
	},
	tick:function(){
		var diff=this.finishTime-this.dateToSec(new Date());
		if(diff<0)
			diff=0;
		IndMain.show('Оставшееся время '+this.secsToHms(diff));
		if(diff)
			this.timer=window.setTimeout("Timer.tick()", 300);
		else
		{
			alert('Время, отпущенное на выполнение заданий, вышло.\nНажмите "ОК" для продолжения');
			OnEnd.call();
		}
	},
	dateToSec:function(t){
		return Math.round(t.getTime()/1000);
	},
	secsToHms:function(t){
		var h=Math.floor(t/3600);
		return this.numToStr(h)+":"+this.numToStr(Math.floor(t/60))+":"+this.numToStr(t%60).substr(0,2);
	},
	numToStr:function(t){
		return t<10?"0"+t:""+t;
	}
}

var FuncChain=new Class({
	Implements:Chain,
	stack:[],
	/*
	initialize:function()
	{

	},
	*/
	add:function(fu, end)
	{
		if(end)
			this.stack.push(fu);
		else
			this.stack.unshift(fu);
	},
	call:function()
	{
		this.chain(this.stack);
		for(j=0;j<this.stack.length;j++)
			this.callChain();
	}
});
var OnEnd=new FuncChain();


var Indicator=new Class({
	initialize:function(y, color){
		if(this.el) return;
		this.el = new Element('div')
			.setStyles({
				'position':itsIE6?'absolute':"fixed",
				'right':0,
				'top':y,
				'color':'white',
				'background-color':color,
				'font-family':'Verdana',
				'font-size':'x-small',
				'padding':3
			}).inject(document.body);
	},
	show:function(text, hide){
		this.el.set('text',text);
		this.el.set('styles', {
			"display": ''
			});
		if(hide) {
			$clear(this.timeout);
			this.timeout = this.hide.bind(this).delay(2000);
		}
	},
	showLater:function(text, delay){
		this.show.bind(this, [text, true]).delay(delay);
	},
	hide:function(){
		this.el.setStyle("display","none");
	}
});
var IndMain;

/*асинхронная обработка больших массивов*/
var Asynch = {
	process:function(arr, func, ondone, onprocess){
		this.arr = arr;
		this.func = func || $empty;
		this.ondone = ondone || $empty;
		this.onprocess = onprocess || $empty;
		this.step = Math.round(this.arr.length/100);
		this.step = this.step < 1?1:this.step;
		this.current = 0;
		this.result = [];
		this.start();
	},
	start:function(){
		var elements = [];
		var count = 0;
		for (var i=this.current*this.step;i<this.arr.length;i++ ){
			if(count == this.step) break;
			if(this.func(this.arr[i]))
				this.result.push(this.arr[i]);
			count++;
		}
		if(this.onprocess!=$empty)
			this.onprocess(this.norm((this.current+2)*this.step*100/this.arr.length));
		this.result  = this.result.concat(elements);
		this.current++;
		if(this.step * this.current < this.arr.length){
			this.start.bind(this).delay(7);
		}else{
			this.ondone(this.result );
		}
	},
	norm:function(pro){
		pro = pro<0 ? 0 : ( pro>100 ? 100 : pro);
		return pro;
	}
}

Element.implement({
	getsById:function(id){
		return this.getElements("*[id="+id+"]");
	},
	getById:function(id){
		return this.getElement("*[id="+id+"]") || false;
	},
	answered:function(){return Element.answered || $empty;}()
});


//объект тест
var Test = {
	init:function(){
		this.max_points=0;
		this.q_num=0;
		this.gained_points=0;
		this.mistakes=0;
		this.answers_log = "";
		return this;
	}
};


// Класс хэширования и других системных функций
var TestHash ={
	stringHashToInt:function(str){
		var str=str.toLowerCase(), sum=0;
		for(var i=0;i<str.length;i++)sum+=Math.round(Math.sin(sum+(i+1)*str.charCodeAt(i))*10000);
		return sum;
	},
	shuffle:function(elements){
		elements.each(function(item,i){
			item.injectBefore(elements[this.newPosition(elements.length-1)]);
		}.bind(this));
	},
	newPosition:function(elementsCount){
		return Math.round(Math.random()*elementsCount);
	},
	floatNormalize:function(str,prec){
		res="";
		str=str.replace(/ /g,"");
		str=str.replace(/,/g,".");
		var num=parseFloat(str);
		if(isNaN(num))return '';
		if(num<0){num=-num;res+="-";}
		res+=Math.floor(num);
		if(prec>0){
			res+=".";
			var x=Math.round((num-Math.floor(num))*(Math.pow(10,prec))).toString();
			while(prec-->x.length) res+="0";
			res+=x;
		}
		return res;
	},
	floatsNormalize:function(str,prec){
		var str_array=str.split("");
		str=str.replace(/- /g,"-");
		if(str.indexOf(";")>=0)
			str=str.replace(/,/g,".");
		if(str.indexOf(" ")>=0 && str.indexOf(";")<0)
			str=str.replace(/ /g,";")
		if(str.indexOf(".")>=0 || str.indexOf(";")<0)
			str=str.replace(/,/g,";");
		var z=0;
		for(var i=0;i<=str_array.length-1;i++)
			if(str_array[i]==",") z++;
		if(str.indexOf(".")<0 && z==1 && str.indexOf(" ")<0){
			window.status='Внимание! Символ "," принят в качестве разделителя целой и дробной части числа.';
			str=str.replace(/,/g,";");
		}
		str_array=str.split("");
		var s="";
		for(var i=0;i<=str_array.length-1;i++){
			if(str_array[i]==";"){
				str_array=str.split(';');
				for(var j=0;j<=str_array.length-1;j++){
					if(this.floatNormalize(str_array[j],prec)=="") continue;
					else s+=this.floatNormalize(str_array[j],prec)+'; ';
				}
				s=s.substr(0,s.length-2);
				return s;
			}
		}
		return this.floatNormalize(str,prec);
	},
	encode:function(val,q_n){
		return (Math.floor(10000000*Math.sin(val+(parseInt(q_n)+1)))^val);
	},
	removeSelections:function(){
		try{window.getSelection().removeAllRanges();}catch(e){}
		try{document.selection.empty();}catch(e){}
	},
	selectElementByNInnerHTML:function(els, value){
		var n = els.filter(function(item){return item.getElement('span[id=n]').innerHTML == value;});
		return n.length?n[0]:null;
	},
	fix:function(el, top, left, right, bottom){
		el = $(el);
		if(itsIE){
			el.setStyles({position:'absolute',top:top,left:left});
			el.style.setExpression('width','document.body.clientWidth-('+(left+right-1)+")");
			el.style.setExpression('height','document.body.clientHeight-('+(top+bottom-1)+")");
		}else{
			el.setStyles({position:'fixed',top:top,left:left,right:right,bottom:bottom});
		}
		return el;
	},
	toArray:function(collection){
		var result = [];
		if(collection)
		switch($type(collection)){
			case 'collection':for (var i=0;i<collection.length;i++ ) result.push(collection[i]); break;
			default:result.push(collection);break;
		}
		return result;
	}
};

// Базовый класс типа ответа
var AnswerType = new Class({
		type:'',
		recognize:$empty,
		clear:function(answer){
			answer.getElement('input[id=answer_string]').value = "";
		},
		setPopup:$empty,
		init:$empty,
		restore:$empty
});

//Переключатели
var checkAnswerType = new Class({
	Extends:AnswerType,
	type:'check',
	recognize:function(answer){
		var result = '', answers = [];
		answer.getsById('element_value').each(function(item){if(item.checked){answers.push(item.getNext().innerHTML.replace(')',''));}});
		result = answers.sort().join(',');
		var ans = answer.getById('answer_string');
		ans.value = result;
		ans.answered();
		return TestHash.stringHashToInt(result);
	},
	restore:function(answer){
		var data = answer.getById('answer_string').value.split(',');
		answer.getsById('element').each(function(el){
			el.getElement('input').setProperty('checked',data.contains(el.getById('n').innerHTML)?true:false);
		});
	},
	clear:function(answer){
		var elements=answer.getsById('element');
			elements.each(function(item,i){item.getFirst().setProperty('checked',false);});
			TestHash.shuffle(elements);
	},
	setPopup:function(answer){
		answer.getsById('element_value').each(function(item){
			item.title = (item.type =='radio'?"Выберите правильный ответ":"Отметьте правильные ответы");
		});
	},
	init:function(answer){
		var children = answer.getsById('element');
		var name = "answer_"+answer.getParent().number+"_"+(""+Math.random()).replace('.','');
		for (var i=0; i<children.length; i++ ){
			var input = new Element('input',{
				type:(answer.getProperty('type')=="check"?"checkbox":"radio"),
				id:'element_value',
				name:name,
				value:answer.getById('n').innerHTML
			}).addEvent('change', this.recognize.bind(this, answer)).injectTop(children[i]);
		}
		answer.getById('answer_string').setStyle("display",'none');
		answer.inited=true;
	}
});
answerTypes.push(new checkAnswerType());
//Галочки
var radioAnswerType = new Class({
	Extends: checkAnswerType,
	type:'radio',
	restore:function(answer){
		var data = answer.get('answer_string').value.split('|');
		answer.gets('element').each(function(el){
			el.getElement('input').removeProperty('name').setProperty('checked',data.contains(el.get('n').innerHTML)?true:null);
		});
	}
});
answerTypes.push(new radioAnswerType());
//Текст
var textAnswerType = new Class({
	Extends:AnswerType,
	type:'text',
	init:function(answer){
		answer.getById('answer_string').addEvent('change',this.recognize.bind(this, answer));
		answer.inited=true;
	},
	recognize:function(answer){
		var ans=answer.getById('answer_string');
		ans.answered();
		return TestHash.stringHashToInt(ans.value);
	},
	setPopup:function(answer){
		answer.getById('answer_string').title="Введите ответ в виде строки.";
	}
});
answerTypes.push(new textAnswerType());
// Дробное число
var floatAnswerType = new Class({
	Extends:AnswerType,
	type:'float',
	init:function(answer){
		answer.getById('answer_string').addEvent('change', this.recognize.bind(this, answer));
		answer.inited=true;
	},
	recognize:function(answer){
		var res="", val = answer.getById('answer_string');
		var str = val.value;
		if(str!=""){
			res=TestHash.floatsNormalize(str,parseInt(answer.getProperty('precision')));
			val.value=res;
			res=TestHash.stringHashToInt(res);
		}
		val.answered();
		return res;
	},
	setPopup:function(answer){
		answer.getById('answer_string').title="Введите ответ в виде десятичной дроби.\nТребуемое количество знаков дробной части: "+answer.getProperty('precision')+".\nПример: \"12.340\"";
	}
});
answerTypes.push(new floatAnswerType());
// Дробные числа
var floatsAnswerType = new Class({
	Extends:floatAnswerType,
	type:'floats',
	setPopup:function(answer){
		answer.getById('answer_string').title="Введите ответ в виде одной или нескольких десятичных дробей, разделенных символом \";\".\nТребуемое количество знаков дробной части: "+answer.getProperty('precision')+".\nПример: \"12.345; 0.670\"";
	}
});
answerTypes.push(new floatsAnswerType());
// Order
var orderAnswerType = new Class({
	Extends:AnswerType,
	type:'order',
	recognize:function(answer){
		var result = [];
		answer.getsById('element').each(function(item){result.push(item.getById('n').innerHTML)});
		var ans=answer.getById('answer_string');
		ans.value=result.join(',');
		ans.answered();
		return TestHash.stringHashToInt(result.join(','));
	},
	restore:function(answer){
		var data = answer.getById('answer_string').value.split(",");
		var elements = answer.getsById('element');
		data.each(function(d){TestHash.selectElementByNInnerHTML(elements,d).injectInside(answer)});
	},
	clear:function(answer){
		answer.getById('answer_string').value = "";
		TestHash.shuffle(answer.getsById('element'));
	},
	setPopup:$empty,
	init:function(answer){
		var _this = this;
		answer.getById('answer_string').setStyle("display",'none');
		var elements = answer.getsById('element').map(function(el){new Element('span').setStyles({'font-weight':'bold'}).set('html',"&lt;&gt;&nbsp;").injectTop(el); return el; });
			elements.each(function(element){
				element
					.setStyles({'cursor':'n-resize', 'white-space':'nowrap'})
					.addEvent('mousedown',function(){
						if(!answer.busy){
							answer.item = this;
							if(!itsIE) answer.item.setOpacity(0.25); else answer.item.setStyle('color','#D8D8D8');
							answer.dragableitem = this.clone().setProperty('id','dragable_element');
							with(answer.dragableitem){
								innerHTML=innerHTML.replace(/<span[^>]*>\s*\d*\s*<\/span>/i,'');
								setStyles({'position':'absolute', 'cursor':'move'})
									.setStyles(this.getCoordinates()).inject(answer.getParent());
								itsIE ? setStyle('color','') : setOpacity(1);
							}
						}
					});
			});
		document.body.addEvents({
			'mouseup':function(){
				if(answer.item){
					answer.busy = true;
					var item = answer.item;
					var myFx = new Fx.Morph(answer.dragableitem, {
						duration: 330,
						onComplete: function(){
							if (!itsIE)
								item.setOpacity(1);
							else
								item.setStyle('color', '');
							answer.dragableitem.destroy();
							answer.busy = false;
						}
					});
					myFx.start(answer.item.getCoordinates());
					answer.item = null;
					_this.recognize(answer);
				}
			},
			'mousemove':function(event){
				if(answer.item){
					var event = new Event(event);
					var scroll = {x:0,y:0};
					var top = scroll.y + event.page.y;
					answer.dragableitem.setStyles({'top':top - 5,'left':event.page.x -15});
					var elements = answer.getsById('element');
					TestHash.removeSelections();
					for (var i=0; i<elements.length ;i++ )
						if(answer.item != elements[i] && _this.getElementTop(elements[i]) > (top)){
							answer.item.injectBefore(elements[i]);
							break;
						}
					if(answer.item != elements[elements.length-1] && _this.getElementTop(elements[elements.length-1]) < (top))
						answer.item.injectAfter(elements[elements.length-1]);
				}
			}
		});
		answer.inited=true;
	},
	getElementTop:function(element){
		return element.getCoordinates().top + element.getSize().y/2;
	}
});
answerTypes.push(new orderAnswerType());

// Matrix
var matrixAnswerType = new Class({
	Extends:AnswerType,
	initialize:function(){
		this.html = "<table style='border-collapse:collapse;'><tr><td></td><td style='text-align:right;vertical-align:middle;'><span id=x_unident>-</span>&nbsp;<span id=x_ident>+</span></td></tr><tr><td style='text-align:center;vertical-align:bottom;padding-bottom:15px;'><span id=y_unident >-</span><br><span id=y_ident >+</span></td><td><div style='border-style:solid;border-width:1px;border-color:#C1C1FF;padding:0;' id=matrix_content>content</div><div id='move_handle' style='width:15px;margin:-6px;text-align:right;cursor:se-resize;float:right'>&nbsp;</div></td></tr></table>";
	},
	type:'matrix',
	restore:function(answer){
		var data = [];
			answer.getById('answer_string').value.slice(1,-1).split(')(').each(function(item, i){data[i]=item.split(';')});
		this.clear(answer);
		this.change_size(answer, null, null, [data[0].length,data.length], data);
	},
	recognize:function(answer){
		var result = this.dataToString(this.getValues(answer), answer.size[0], answer.size[1]);
		var ans=answer.getById('answer_string');
		ans.value = result;
		ans.answered();
		return TestHash.stringHashToInt(result);
	},
	clear:function(answer){
		answer.size = [2,2];
		answer.data = [];
		answer.getById('answer_string').value = "";
		answer.getsById('text').each(function(item){item.setProperty('value','')});
		this.draw_matrix(answer);
	},
	setPopup:$empty,
	init:function(answer){
		this.size = [50,20];
		this.max = 20;
		var tmp=new Element("input").inject(document.body);
		var border=tmp.getStyle("border-top-width");
		tmp.destroy();
		tmp=border.match(/(\d+)\s*px/i);
		if(tmp){
			tmp=parseInt(tmp[1]);
			border= $chk(tmp) ? tmp : 0;
		}
		else border=0;
		this.outerSize=[this.size[0]+2*border,this.size[1]+2*border];
		new Element('div').set('html',this.html).injectInside(answer);
		var style= {'cursor':'hand', 'cursor':'pointer'};
		answer.getById('answer_string').setStyle("display","none");
		answer.getById('x_ident').setStyles(style).addEvent('click',this.change_size.bind(this,[answer,'x', true]));
		answer.getById('x_unident').setStyles(style).addEvent('click',this.change_size.bind(this,[answer,'x', false]));
		answer.getById('y_ident').setStyles(style).addEvent('click',this.change_size.bind(this,[answer,'y', true]));
		answer.getById('y_unident').setStyles(style).addEvent('click',this.change_size.bind(this,[answer,'y', false]));
		var content = answer.getById('matrix_content').empty();
 		content.makeResizable({
			handle:answer.getById('move_handle'),
			grid: {x:this.outerSize[0], y:this.outerSize[1]},
			limit: {x: [this.outerSize[0], this.outerSize[0]*this.max], y:[this.outerSize[1], this.outerSize[1]*this.max]},
			modifiers: {x: 'width', y: 'height'},
			onComplete:this.setNewSize.bind(this,answer),
			onStart:function(){content.setStyle('overflow','hidden')}
		});
		answer.inited=true;
	},
	draw_matrix:function(answer){
		var self=this;
		var size = answer.size;
		var prec=parseInt(answer.getProperty('precision'));
		var content = answer.getById('matrix_content').setStyles({'padding':'0', 'margin':'0'}).empty();
		for (var y=0;y<parseInt(size[1]);y++){
			var row = new Element('div').setStyles({'white-space':'nowrap','padding':'0','margin':'0'});
			for (var x=0; x<parseInt(size[0]); x++ ){
				new Element('input',{type:'text',events:{'change':function(){self.recognize.run(answer,self);this.value=TestHash.floatNormalize(this.value,prec)}},styles:{'width':this.size[0], 'height': this.size[1],'text-align':'center','margin':'0','padding':'0'}})
					.setProperty('value',(function(){try{return answer.data[y][x]}catch(e){return '';}})() || '')
					.injectInside(row);
			}
			row.injectInside(content);
		}
		content.setStyles({'width':answer.size[0]*this.outerSize[0], 'height':answer.size[1]*(this.outerSize[1]+(itsIE?2:0))});
		//this.recognize(answer);
	},
	setNewSize:function(answer){
			var content = answer.getById('matrix_content');
			var size = content.getSize();
				content.setStyles({'overflow':''})
			this.change_size(answer, null, null,[Math.round(size.x/this.size[0]),Math.round(size.y/this.size[1])]);
	},
	change_size:function(answer ,vector, ident, values, data){
		if(data) answer.data = data;
		else this.getValues(answer);
		var nsize = answer.size;
		if(values){
			nsize = values;
		}else{
			nsize[vector=='x'?0:1] = nsize[vector=='x'?0:1]+(1*(ident?1:-1));
			nsize[vector=='x'?0:1] = nsize[vector=='x'?0:1] > 0?nsize[vector=='x'?0:1]:1;
		}
		answer.size = nsize;
		this.draw_matrix(answer);
	},
	getValues:function(answer){
		var result = answer.data || [];
		var prec=parseInt(answer.getProperty('precision'));
		answer.getById('matrix_content').getChildren().each(function(item,i){
			result[i]=result[i] || [];
			var data = [];item.getChildren().each(function(input, k){result[i][k]=TestHash.floatNormalize(input.value,prec);});
		});
		answer.data = result;
		return answer.data;
	},
	dataToString:function(data, x, y){
		var result = "";
		for (var i=0; i<y; i++ ) result+="("+data[i].slice(0, x).join(';')+")";
		return result;
	}
});
answerTypes.push(new matrixAnswerType());

// graf
/* Графическая библиотека */
var Line = new Class({
	initialize:function(start,end, canvas, detalization , size){
		this.detalization = detalization || 15;
		this.size = size || 2;
		this.start = start;
		this.end = end;
		this.points = [];
		this.canvas = canvas;
		this.draw(this.start, this.end);
	},
	getStep:function(start, end){
		var dx = end[0] - start[0];
		var dy = end[1] - start[1];
		return {'x':dx * 1/this.detalization,'y':dy * 1/this.detalization};
	},
	getPixel:function(){
		return new Element("div").appendText(" ").setStyles({"position":"absolute",'width':this.size,'height':this.size,'background-color':'black'});
	},
	draw:function(start, end){
		if(!this.points.length)
		for (var i=0;i<=this.detalization; i++ )
			this.points.push(this.getPixel().inject(this.canvas));
		this.step = this.getStep(start, end);
		this.points.each(function(point, i){
			var top = start[1] + (this.step.y * i);
			var left = start[0] + (this.step.x * i);
			if (itsIE) {
				point.style.top = top;
				point.style.left = left;
			} else
			point.setStyles({"top":top,"left":left});
		}.bind(this));
		return this;
	},
	fromElementToPoint:function(element, point){
		var elementleft = (element.getCoordinates().left+element.getSize().x/2) < point[0];
		return this.draw(this.getElementCoordinates(element, !elementleft), point);
	},
	connectElements:function(first, second){
		var firstleft = first.getCoordinates().left < second.getCoordinates().left;
		var start = this.getElementCoordinates(first, !firstleft);
		var end = this.getElementCoordinates(second, firstleft);
		return this.draw(start, end);
	},
	getElementCoordinates:function(el, left){
		return [el.getLeft()+(left?0:el.getSize().x), el.getTop()+el.getSize().y/2];
	},
	remove:function(){
		this.points.each(function(point){point.destroy();});
		this.points=[];
		return this;
	}
});

var grafAnswerType = new Class({
	Extends:AnswerType,
	type:'graf',
	recognize:function(answer){
		var result = [];
		var direct = this.direct(answer);
		answer.connections.each(function(c){
			var first = parseFloat(c.from.getElement("span[id=n]").innerHTML);
			var second = parseFloat(c.to.getElement("span[id=n]").innerHTML);
			result.push(direct?first+"-"+second:(first<second?first+"-"+second:second+"-"+first));
		});
		var ans=answer.getElement("input[id=answer_string]");
		result = ans.value = result.sort(function(from, to){
			var f = from.split("-").map(function(f){return parseFloat(f);});
			var t = to.split("-").map(function(f){return parseFloat(f);});
			if(f[0]<t[0]) return -1;
			if(f[0]==t[0]){ if(f[1]<t[1]) return -1; if(f[1] == t[1]) return 0;};
			return 1;
		}).join(';');
		ans.answered();
		return TestHash.stringHashToInt(result);
	},
	restore:function(answer){
		var str = answer.getElement('input[id=answer_string]').value;
		var getElementByInner=function(value){
			var target;answer.getElements('div[id=line]').each(function(line){if(line.getElement('span[id=n]').innerHTML == value)target = line;});
			return target;
		};
		str.split(';').each(function(duo){
			duo = duo.split('-');
			answer.connections.push(new this.connection(getElementByInner(duo[0]),getElementByInner(duo[1]), null, answer) );
		}.bind(this));
	},
	clear:function(answer){
		with(answer){
			getById('answer_string').value = "";
			getElements('td').each(function(td){
				TestHash.shuffle(td.getChildren());
			});
			if(connections && connections.length)
				connections.each(function(c){c.line.remove()});
			connections = [];
		}
	},
	setPopup:function(){
	},
	init:function(answer){
		var _this = this;
		var direct = this.direct(answer);
		var connection = this.connection;
		answer.connections = [];
		[answer.getById("answer_string")].concat(answer.getsById("n")).each(function(n){n.setStyle("display","none")});
		var tds = answer.getElements('td');
		tds.each(function(td ,i){
			var align = "center";if(i==0) align = 'right';if(i== tds.length-1) align = 'left';
			td.setStyles({"padding-right":"100px","text-align":align,'white-space':'nowrap'});
			td.getChildren().each(function(item){
				item.setStyles('padding:2px 5px;cursor:hand;cursor:pointer;white-space:nowrap;');
				item.addEvents({
					'mousedown':function(event){
						event = new Event(event);
						answer.preconnection = new connection(this, null , new Line([0,0],[0,0],answer));
						TestHash.removeSelections();
					},
					'mouseup':function(){
						if(answer.preconnection && _this.canConnectItems(answer.preconnection.from,this, answer )){
							var con = new connection(answer.preconnection.from, this, null, answer);
							answer.connections.push(con);
							con.line.points.each(function(point){
								point.addEvents({
									'mouseenter':function(){
										_this.flash(con.from,con.to,con.line, 'red');
									},
									'mouseleave':function(){
										_this.unflash(con.from,con.to,con.line);
									},
									'click':function(){
										_this.unflash(con.from,con.to,con.line);
										answer.connections.erase(con);
										con.line.remove();
									}
								})
								.setStyle("cursor","crosshair");
							});
							_this.recognize(answer);
							_this.unflash(answer.preconnection.from,this,answer.preconnection.line);
						}
						TestHash.removeSelections();
					},
					"mousemove":function(event){
						if(answer.preconnection){
							if(_this.canConnectItems(answer.preconnection.from,this, answer ) ) {
								new Event(event).stop();
								answer.preconnection.line.connectElements(answer.preconnection.from, this);
								_this.flash(answer.preconnection.from,this,answer.preconnection.line, "green");
							}
						}
					},
					'mouseleave':function(){
						if(answer.preconnection){
							_this.unflash(answer.preconnection.from,this,answer.preconnection.line);
						}
					},
					'dblclick':function(){
						var connections = [];
							answer.connections.each(function(c){
								if( c.from == this ||(!direct && c.to == this))
									c.line.remove();
								else connections.push(c);
							}.bind(this));
						answer.connections = connections;
						TestHash.removeSelections();
						_this.recognize(answer);
					}
				});
			});
		});
		document.body.addEvents({
			'mousemove':function(event){
				if(answer.preconnection){
						TestHash.removeSelections();
					var event = new Event(event);
					var scroll = window.ie?document.body.getSize().scroll:{x:0,y:0};
					answer.preconnection.line.fromElementToPoint(answer.preconnection.from, [event.page.x+scroll.x,event.page.y+scroll.y]);
				}
			},
			'mouseup':function(){
				if(answer.preconnection){
					answer.preconnection.line.remove();
				}
				answer.preconnection = null;
			}
		});
		window.addEvent("resize",function(){
			answer.connections.each(function(x){
				x.line.remove();
				x.line.connectElements(x.from, x.to);
			});
		});
		answer.inited=true;
	},
	direct:function(answer){
		return !!answer.getProperty('direct');
	},
	linecount:function(answer){
		return parseInt(answer.getProperty('linecount')) || 0;
	},
	canConnectItems:function(from, to , answer){
		if(from.getParent().getNext() != to.getParent() && from.getParent().getPrevious() != to.getParent())
			return false;
		var direct = this.direct(answer);
		if($defined(answer.connections) && answer.connections.some(function(conn){
				if(direct)
					return (conn.from == from && conn.to == to);
				else
					return (conn.from == from && conn.to == to) || (conn.from == to && conn.to == from);
		}))
			return false;
		return true;
	},
	connection:function(from, to, line, answer){
		this.from = from;
		this.to = to;
		this.line = line || new Line([0,0],[0,0],answer).connectElements(from, to);

	},
	flash:function(from, to , line, color){
		 [from,to].each(function(el){el.setStyle('color',color);});
		 line.points.each(function(el){el.setStyle('background-color',color?color:'black');});
	},
	unflash:function(from, to , line){
		this.flash(from, to , line,'');
	}
});
answerTypes.push(new grafAnswerType());

var TestLogic ={
	init:function(){
		//индикатор
		IndMain=new Indicator(0,'#FF0000');
		IndMain.show('Инициализация...');

		this.questions = document.body.getsById('question').setStyle("display", "none");
		this.answers = document.body.getsById('answer').setStyle("display", "none");
		if ($("test_block")) {
			document.body.getsById("test_block").each(function(block){
				block.getsById("question").each(function(item, j){
					item.number = j;
				})
			});
		}
		else
			this.questions.each(function(item, ind){
				item.number = ind;
			});
		var f=$empty;
		if (!rightAnswers) {

			if ($defined(testapi)){
				with(testapi){
					var x;
					if(testapi.blocks && blocks.length>0)
						x=blocks;
					if(testapi.selection && selection.length>0)
						x=selection;
				}
				if ($chk(x) && $type(x) == "array") {
					this.questions = [];
					(this.answers = Selecting.getAnswers(x)).each(function(ans){
						this.questions.include(ans.getParent());
					},this);
					TestHash.shuffle(this.questions);
				}
			}
		}
		else {
			f = function(){
				this.answers.each(function(item, i){
					item.getById('answer_string').value = rightAnswers[i];
					var type = normalizeType(item.getProperty('type'));
					if (type != null)
						type.restore(item);
				});
				this.check();
			}
		}
		this.start(f.bind(this));
	},
	start: function(oninit){
		lms.courseStageStart();
		Asynch.process(this.answers, function(item){
				var type = normalizeType(item.getProperty('type'));
				if (type != null && !$defined(item.inited))
					type.init(item);
			},
			function(){
				OnEnd.add(this.check.bind(this));
				$('check').getFirst().addEvent('click', OnEnd.call.bind(OnEnd));

				//	$('clear').getFirst().addEvent('click',this.clear.bind(this));
				Test.init();
				Asynch.process(this.answers, function(item){
						var type = normalizeType(item.getProperty('type'));
						if (type != null)
							type.clear(item);
					},
					function(){
						Asynch.process(this.answers, function(item){
								var type = normalizeType(item.getProperty('type'));
								if (type != null && !$defined(item.inited))
									type.init(item);
							},
							function(){
								Asynch.process(this.answers,
									function(item){
										Test.max_points += parseInt(item.getElement('span[id=points]').innerHTML);
										item.setStyle("display", "").getParent().setStyle("display", "");
									},
									function(){
										$('results').set('text', "Максимальная сумма баллов: " + Test.max_points);
										if (testapi){
											if (testapi.shuffle){
												TestHash.shuffle(this.questions);
											}
											if (!rightAnswers && testapi.time)
												Timer.initialize(testapi.time);
										}
										IndMain.showLater('Готово',1000);
										if (oninit && typeof(oninit) == 'function')
											oninit();
									}.bind(this)
								);
							}.bind(this)
						);
					}.bind(this)
				);
			}.bind(this),
			function(procent){
				IndMain.show('Инициализация вопросов (' + Math.round(procent) + '%)');
			}
		);
	},
	check: function(){
//alert("check");
		Blocker.block();
		$('check').set('styles', {
			'visibility': 'hidden'
		});
		Element.implement({answered:$empty});
		//Element.implement({answered:$empty});
		this.answers.each(function(item, i){
			window.status = 'Проверка  вопросов (' + (i + 1) + ' из ' + this.answers.length + ')';
			var type = normalizeType(item.getProperty('type'));
			if (type != null) {
				var got = type.recognize(item);
				var mustBe = parseInt(item.getProperty('right'));
				var right = (TestHash.encode(got, parseInt(item.getParent().number)) == mustBe);
				if (!right && $defined(item.getProperty('altright'))) {
					var ans = ('' + item.getProperty('altright')).split(',');
					for (var k = 0; k < ans.length; k++) {
						if (TestHash.encode(got ^ parseInt(ans[k]), parseInt(item.getParent().number)) == mustBe) {
							right = true;
							break;
						}
					}
				}
				if (right)
					Test.gained_points += parseInt(item.getElement('span[id=points]').innerHTML);
				else
					Test.mistakes++;
				Test.answers_log += (item.getParent().number + '=' + item.getElement('input[id=answer_string]').value) + ';';
				item.addClass(right ? 'right' : 'wrong');
			}
		}.bind(this));
		var attempt=CooCounter.countCookie();
		var html = "<div>Общая сумма баллов: " + Test.gained_points + " из " + Test.max_points + " (" + Math.round((Test.gained_points) * 100 / Test.max_points) + "%)</div><div>Допущено ошибок: " + Test.mistakes + "</div>";
		html+="<div>Номер попытки: "+(attempt==0?"неопределён":attempt)+"</div>";
		$('results').set('html', html);
		IndMain.showLater('Готово', 1000);
		lms.courseStageEnd();
	}
};

var Blocker = {
	blocked:false,
	block:function(){
		this.blocked = true;
		new Element('div',{id:'blocker'})
			.setOpacity(0.01)
			.setStyles($(document.body).getCoordinates())
			.inject(document.body);
	},
	unblock:function(){
		this.blocked = false;
		if($('blocker')) $('blocker').destroy();
	}
}

// Логика LMS
var LMS = new Class({
	initialize:function(){
		if(!this.api())
			window.status = "Ошибка инициализации LMS";
	},
	api:function(){
		try{return window.opener.window.LMS_API;}catch(e){};
		try{return window.parent.window.LMS_API;}catch(e){};
		return false;
	},
	courseStageEnd:function(){
		if(!this.api()) return;
		this.api().courseStageEnd(Test.gained_points,Test.max_points,Test.answers_log);
	},
	courseStageStart:function(){
		if(!this.api()) return;
		this.api().courseStageStart();
	}
});

// Глобальные переменные
var lms = new LMS();
function normalizeType(type){
	for (var i=0;i<answerTypes.length;i++ )
		if(answerTypes[i].type == type)
			return answerTypes[i];
	window.status = ('Не найдена библиотека для типа вопроса '+type);
	return null;
}

// заглушки для совместимости с предыдущей версией
window['fill_answers']=window['init'] = $empty;

var backcompatibality = function(){
	window.init=function(){};
	$('loading_label').destroy();
	var form = $(document.body).getElement('form[name=test]');
	if(form) form.setStyle("display","");
	form = null;
	$('check').getFirst().onclick = function(){};
	$('clear').getFirst().onclick = function(){window.location.href=window.location.href};
}

function start()
{
	CooCounter.init();
	TestLogic.init();
}

window.addEvent(itsIE6?"load":"domready",function(){
	//запуск заплатки
	backcompatibality();
	//запуск логики тестирования
	if(!rightAnswers){
		if ($chk(Settings)) {
			if(!Selecting.map)
				Selecting.classify(document.body.getsById('answer'));
			setup();
		}
		else {
			Selecting.init();
			start();
			if ($chk(ServiceExchange)){
				ServiceExchange.init($("check"));
			}
		}
	}
	else
		start();
});