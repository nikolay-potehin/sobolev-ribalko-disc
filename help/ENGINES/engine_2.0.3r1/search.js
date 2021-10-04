/*Руководитель проекта: Третьяков В.С.
Разработка:Савельев А.А., Трояновский М.Б., Титов И.В.,  Катков А.Ю., Громов И.В.
Дизайн: Щербаков А.В.
ГОУ ВПО "УГТУ-УПИ имени первого Президента России Б.Н.Ельцина"
Центр Информационного компьютерного обеспечения 2008-2009г*/
Ext.namespace("Ext.sp");
Ext.sp.Search = {
	id:"search-panel",

	config:{},

	tryinit:function(onsuccess){
		var Search = this;
		Ext.Ajax.request({
			url: "./search/$config.js", 
			success: function(r){				
				var config = Ext.util.JSON.decode(r.responseText);
				if(config.success){
					Search.config = config;
					onsuccess.defer(9);
					var icon = Ext.getCmp('find-icon');
					if(icon) icon.setDisabled(false);
				}
			}
		});
	},

	icon:function(){
		var Search = this;
		return {
			id:"find-icon",
			iconCls:"find",
			handler:function(){Search.show()}/*,
			disabled:true*/
		}
	},

	show:function(){
		var tabpanel = Ext.getCmp('content');
		var searchpanel = Ext.getCmp(this.id);
		if(!searchpanel){
			searchpanel = this.getSearchPanel();
			tabpanel.add(searchpanel);
		}
		tabpanel.setActiveTab(searchpanel);
	},

	getSearchPanel:function(){
		var Search = this;
		var store = new Ext.data.SimpleStore({
			fields: ['id', 'name'],
			data : [['','во всех']].concat(blocktypes)
		});
		/*var combo = new Ext.form.ComboBox({
			store: store,
			id:"search-combo",
			displayField:'name',
			typeAhead: false,
			mode: 'local',
			triggerAction: 'all',
			emptyText:'во всех',
			selectOnFocus:true
		});*/



		var pb = new Ext.ProgressBar({
		   id:'search-progress',
		   text:'Инициализация...',
	       width:200,
		   hidden:true
		});
		var tbar = [
			new Ext.form.TextField({
				id:'search-text-field',
				width: 200,
				emptyText:'Минимум '+Search.config.charscount+" символа",
				listeners:{
					click:function(){
						//alert('');
					}
				}
			}),/*" в блоке ",
			combo,*/' ',
			{
				text:"Искать",
				iconCls:'search',
				handler:function(){
					var request = Ext.getCmp("search-text-field").getValue();
					Search.search(request);
				}
			},'->',pb];
		return new Ext.Panel({
			id:Search.id,
			tbar:tbar,
			autoScroll:true,
			iconCls:"find",
			title:"Поиск",
			html:" ",
			closable:true
		});
	},
	search:function(input){
		var request = input;
		var pb = Ext.getCmp('search-progress');
			pb.setVisible(true);
		var Search = this;
		var data = new Hash({});
		var allonload = function(){
			pb.updateProgress(1,"Отображение");
			pb.setVisible(false);			
			Ext.getCmp('search-panel').body.dom.innerHTML = Search.dataToHtml(data,request);
		}

		input = input.trim().toLowerCase().split(" ").filter(function(word){			
			return word.length >= Search.config.charscount;
		}).map(function(word){
			return word.slice(0,Search.config.charscount);
		});
	
		input = input.filter(function(word){
			return Search.config.files.contains(word);
		})
		if(input.length == 0){
			allonload();
		}
		input.each(function(word,i){			
			var success = function(response){				
				var feed = Ext.util.JSON.decode(response.responseText.replace("var data=",""));
				data.extend(feed);
				pb.updateProgress(i/input.length,"Загрузка");
				if(input.length-1 == i) allonload();
			}
			var failure = function(){
				if(input.length-1 == i) allonload();
			}
			Search.loadRange(word,success,failure);
		})
		
	},

	loadRange:function(range, success, failure){
		Ext.Ajax.request({
			url: "./search/"+range+".js", 
			success: success,
			failure:failure
		});
	},

	dataToHtml:function(data, request){
		var Search = this;
		var words = request.toLowerCase().trim().split(" ").filter(function(word){
			var count = Search.config.charscount;
			return (word.length >= count) && (Search.config.files.contains(word.slice(0,count)));
		});

		data = data.filter(function(resId, word){			
			return words.some(function(w){				
				 return word.indexOf(w) != -1;
			});
		});

	//	var combo = Ext.getCmp('search-combo');	
		var blocktype = "";//combo.getValue()==""|"во всех"?"":blocktypesobj[combo.getValue()][0];
		
		
		var resources = {};
		data.each(function(paths, word){
			if(blocktype!="")
				paths = paths.filter(function(path){
					return path.split(",").slice(1).some(function(className){
						return className.toLowerCase() == blocktype.toLowerCase();
					})
				})
			paths.each(function(path){
				path = path.split(",")[0];
				resources[path] = resources[path] || [];
				resources[path].push(word);
			})				
		});
		resources = new Hash(resources);
		
		var html = [];
		var count = 0;
		resources.each(function(words, resId){
			count ++;			
			var item = Manifest.getItemIdByResource(resId);		
			if(item && item.title!='preface'){
				var title = item.title.replace(/^[.0-9 ]*/g,"");
				html.push("<div  style='padding-bottom:10px;'class=file ><a href='#' onclick=$show('"+item.identifier+"',true,null,'"+words.join("," )+"') >"+title+"</a>"+"<br/><span style='color:green;font-size:x-small;padding-left:20px;'>["+words+"]</span>"+"</div>");					
			}			
		});
		html.unshift("<div style='color:gray;padding-left:10px;'>Результат поиска по запросу '<b style='color:black;'>"+request+"</b>' "+(blocktype?"в блоках \'<b style='color:black;' >"+combo.getValue()+"</b>\'":"")+", найдено <b style='color:black;' >"+count+"</b> ресурсов.</div>");
		return html.join("");
	}
}