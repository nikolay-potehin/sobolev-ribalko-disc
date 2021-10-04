/*Руководитель проекта: Третьяков В.С.
Разработка:Савельев А.А., Трояновский М.Б., Титов И.В.,  Катков А.Ю., Громов И.В.
Дизайн: Щербаков А.В.
ГОУ ВПО "УГТУ-УПИ имени первого Президента России Б.Н.Ельцина"
Центр Информационного компьютерного обеспечения 2008-2009г*/






var version = "2.1.0";
document.title +=" - "+version;
var admining = document.location.search.indexOf("admin")!=-1;
//-----------------
var tttransform = function(name){	
	for (var i=0;i<treetypes.length;i++ ){		
		if(treetypes[i][4] == name){
			return treetypes[i][0];
		}
	}
	return name;
};
var untttransform = function(name){
	for (var i=0;i<treetypes.length;i++ ){
		if(treetypes[i][0] == name){
			return treetypes[i][0] || treetypes[i][0];
		}
	}
	return name;
};

var treetypesobj = (function(){
	var obj = {};
		treetypes.each(function(type){
			obj[type[0]] = type; 
		});
	return obj;
})();
var blocktypesobj = (function(){
	var obj = {};
	blocktypes.each(function(type){
		obj[type[1]] = type;
	});
	return obj;
})();
//-----------------
var Manifest = {
	toLine:function(item){
		var array = [item];
		if(item.item){
			if(item.item.length){
			for (var i=0;i<item.item.length;i++ )
				array = array.concat(this.toLine(item.item[i]));			
			}else{
				array = array.concat(this.toLine(item.item));	
			}			
		}
		return array;
	},
	getItem:function(id){
		for (var i=0;i<this.organization.length;i++){			
			if(this.organization[i].identifier == id)
				return this.organization[i];
		}
		return null;
	},
	getItemIdByResource:function(id){
		for (var i=0;i<this.organization.length;i++){			
			if(this.organization[i].identifierref == id)
				return this.organization[i];
		}
		return null;
	},
	getTitle:function(){
		return Manifest.get('manifest.metadata.lom:lom.lom:general.lom:title.lom:string').value; 		
	},	
	get:function(request){
		var p = request.split(".");
		var result = imsmanifest;
		for (var i=0;i<p.length; i++){		
			result = result[p[i]];
			if(!result) return null;
		}
		return result;
	},
	getResourcePath:function(resourceId){
		var resources = imsmanifest.manifest.resources.resource;
		for (var i=0;i<resources.length;i++ ){
			if(resources[i].identifier == resourceId)
				return resources[i].href;
		}
		return null;
	},
	isSCO:function(resId){
		var resources = imsmanifest.manifest.resources.resource;
		for (var i=0;i<resources.length;i++ ){
			if(resources[i].identifier == resId)
				return resources[i]["adlcp:scormType"] == 'sco';
		}
		return false;
	},
	getPath:function(id){
		var path = [id];
		var parent;
		while(parent = Manifest.getParent(id)){
			id = parent.identifier;
			path.push(id);
		}
		return path.reverse().join("/");
	},
	getParent:function(id){
		var org = Manifest.organization;
		for (var i=0;i<org.length;i++){
			if(org[i].item )
				if(org[i].item.some)
					if(org[i].item.some(function(item){return item.identifier == id}))					
				return org[i];
		}
		return null;
	},
	lcaption:function(caption){
		var cap = (caption||"").split(" ");
		return cap.slice(0,3).join(" ")+(cap.length > 3?"...":"");
	},
	getPreference:function(item){		
		return {
			title:Manifest.lcaption(item.title),			
			sco:Manifest.isSCO(item.identifierref),
			book:false,
			test:false,
			leaf:!item.item,
			params:item.parameters?Ext.util.JSON.decode("{"+item.parameters+"}"):null
		}
	}
}
Manifest.organization = Manifest.toLine(imsmanifest.manifest.organizations.organization);
//----------------------
Ext.namespace("Ext.sp");
//----------------------
Ext.sp.Organization = function(type) {	
	var self = this;
	var store = new Ext.data.SimpleStore({
		fields: ['name'],
		data : [["--нет--"]].concat(treetypes.map(function(type){			
			return [type[4] || type[0]];
		}))
	});
	var combo = new Ext.form.ComboBox({
		store: store,
		displayField:'name',
		typeAhead: false,
		mode: 'local',
		value:type, 
		triggerAction: 'all',
		emptyText:'Фильтр структуры',
		selectOnFocus:true,
		listeners:{
			select :function(combo, record, index){
				var childs = [];
				var root =  Ext.getCmp('organization').getRootNode();
				var items =root.eachChild(function(child){childs.push(child)});
					childs.each(function(child){child.remove()});					
					root.appendChild(Ext.sp.Tree.get(tttransform(record.data.name)));	
					root.expandChildNodes(2);
			}
		}		 
	});

    Ext.sp.Organization.superclass.constructor.call(this, {
		id:"organization",
        xtype: 'organization',	
		layout:'fit',
		autoScroll: true,
		border:false,		
		rootVisible: false,
		listeners:{
			click: function(n, e) {	
				if(admining){
					 e.stopEvent();
					if(e.ctrlKey) 
						Ext.getCmp('links').addLeft(n.attributes.id);
					if(e.shiftKey) 
						Ext.getCmp('links').addRight(n.attributes.id);
				}
				n.expand();
				$show(n.attributes.id, e.ctrlKey);
				
			}
		},	
	   rootVisible: false,
	   root:new Ext.tree.AsyncTreeNode({
			id:'root',	
			expanded: true,
			children: Ext.sp.Tree.get(type)
	   }),
       tbar:[combo,"->",{
				iconCls:"help",				
				handler:function(){
					window.open("./help/index.html");
				}
			},			
			Ext.sp.Search.icon(),{
			id:"nav-up",
			iconCls:"nav-up",
			handler:function(){
				var node = self.getSelectionModel().selNode;				
				if(node && node.parentNode)							
					$show(node.parentNode.id);						
			},
			disabled:false
		}," ",{
			id:"nav-left",
			iconCls:"nav-left",
			handler:function(){
				var node = self.getSelectionModel().selNode;				
				if(node && node.previousSibling)							
					$show(node.previousSibling.id);						
			},
			disabled:false
		}," ",{
			id:"nav-right",
			iconCls:"nav-right",
			handler:function(){
				var node = self.getSelectionModel().selNode;				
				if(node && node.nextSibling)							
					$show(node.nextSibling.id);						
			},
			disabled:false
		}]		
    });    
};
//----------------------
Ext.sp.Organization = Ext.extend(Ext.sp.Organization, Ext.tree.TreePanel, {   
	show:function(itemId){			
		var path ="/root/"+Manifest.getPath(itemId).split("/").slice(1).join("/");		
		this.expandPath(path);
		this.selectPath(path);
	}
});
Ext.reg("organization", Ext.sp.Organization);
//------------------------
Ext.sp.Tree = {
	get:function(type, filter){		
		var type=type=='--нет--'?null:type;	
		return Ext.sp.Tree.convertItems(imsmanifest.manifest.organizations.organization.item,type);
	},
	convertItems:function(items,type){		
		var converted = [];
		var self = this;
		Ext.each(items.length?items:[items],function(it){		
			var t = self.getTypeFromParams(it.parameters);				
			if(it.title != "preface"){				
				if(t=='' ||t == type || !type){
					var item = Ext.sp.Tree.convertItem(it);
					item.children = !it.item  ? null : Ext.sp.Tree.convertItems(it.item, type);				
					if(!it.item || (item.children && item.children.length>0))
					converted.push(item);
				}
			};
		});			
		return converted;
	},		
	getTypeFromParams:function(params){	
		if(!params) return "";
		var match = params.match(/t:'([^\']*)'/gi);
		return match?(""+match).replace("t:'","").replace("'",""):"";
	},
	convertItem:function(item){
		return {			
			"text":admining?"["+item.identifier+"]"+item.title:item.title,//.replace(/^[.0-9 ]*/g,"")
			"id":item.identifier,												
			"leaf":!item.item,
			"iconCls":this.getItemIconCls(item)
		}
	},
	getItemIconCls:function(item){
		var str = this.getTypeFromParams(item.parameters);
		//alert(str);
		var treetype = treetypesobj[str]?treetypesobj[str]:["",	"",	"tree-icon-resource",	"tree-icon-resource-folder"];
		var leaf = !(item.item && item.item.length);
		//alert(treetype[leaf?2:3])
		return treetype[leaf?2:3];	
	}
}
//---------------------
var currentItem = null;
Ext.sp.Content = Ext.extend(Ext.TabPanel,{	
	initComponent : function(){       
		Ext.sp.Content.superclass.initComponent.call(this);
	},
	enableTabScroll: true,
	currentTab:null,
	scoBusy:false,
	show:function(itemId, newtab, block, request, forse){		
		
			var tab = this.getActiveTab();	
			var item = Manifest.getItem(itemId);
			var self = this;
			var pre = Manifest.getPreference(item);				
			var count = Manifest.toLine(item).length;
			var index = this.items?this.items.findIndex("id",tab?tab.id:""):-1;	
			
			var curtab = this.getComponent("id-"+itemId);
			if(curtab && !forse){
				this.setActiveTab(curtab);
				if(curtab.scrollToBlock && block>=0)				
					curtab.scrollToBlock(block);				
				return;
			}

			if(tab && !newtab) {
				tab.hide();
				var tbid = tab.id;
				if(tbid){
					var fnc = function(){var cmp = Ext.getCmp(tbid);self.remove(cmp)}
					if(pre.sco){
						window.setTimeout(fnc,9);
					}else{
						fnc();
					}
				}
				tab = null;
			}
			if(pre.sco){
				tab = new Ext.ux.Sco({id:"id-"+itemId});
			}else{						
				if(count>500){
					tab = new Ext.ux.Listing({id:"id-ch-"+itemId})
						
				}else
				if(count<95){
					tab = new Ext.ux.Book({id:"id-"+itemId});
					if(request) {tab.request = request;}
				}else{
					tab = new Ext.ux.Listing({id:"id-"+itemId});
				}
			}
			tab.on("activate", function(pan){
				var id = pan.id.replace("id-","");
				currentItem = id;
					Ext.getCmp('organization').show(id);
					Ext.getCmp('links')._id = id;
					Ext.getCmp('links').show(id);
			});
			if(index<0 || newtab /*|| pre.sco*/){			
				this.add(tab);		
			}else{
				this.insert(index, tab);		
			}
			this.setActiveTab(tab);
			if(block>=0 && tab.scrollToBlock){
				tab.block = block;
			}
	}
});
Ext.reg("content", Ext.sp.Content);
//--------------------------------
Ext.ux.IframeComponent = Ext.extend(Ext.BoxComponent, {
     onRender : function(ct, position){
		 Ext.ux.IframeComponent.superclass.onRender.call(this, ct, position); 
         this.el = ct.createChild({tag: 'iframe', id: 'iframe-'+ this.id, frameBorder: 0, src: this.url});
		 return true;
     }
});
//---------------------------------
Ext.ux.Book = function(p) {

	var self = this;
	var checkHandler = function(item){	self.filter(item.id);};
	var buttons = [{id:"all",text:"Все", enableToggle: true,pressed:true, listeners:{click:checkHandler}}];
	for (var i=0;i<blocktypes.length-1;i++ ){
		buttons.push({
			id:blocktypes[i][0],
			text:blocktypes[i][1],
			enableToggle: true,
			listeners:{click:checkHandler}
		});
	}
	//buttons.push({id:'others',text:"Прочие", display:false,	 listeners:{click:checkHandler}});
    Ext.ux.Book.superclass.constructor.call(this, {
        id:p.id,          
		html:'html',
        layout:'fit', 
		autoScroll:true,
		closable:true,
		tbar:buttons			
    });   	
};

Ext.extend(Ext.ux.Book, Ext.Panel, {  	  
	initComponent:function(){		
		 var id = this.id.replace("id-","");		
		 var item = Manifest.getItem(id);			
		 var pre = Manifest.getPreference(item);		
		 this.title = pre.title;	
		 this._items = Manifest.toLine(item);
		 var count = 0;		
		 var totalcount = 0; 
		
		
		 this.addListener('render',function(ct, position){
			 this.body.dom.id = "main";
			 var html = [];			
			 var self = this;
				Ext.each(this._items,function(item,i){
					if(item.title == 'preface') return;
					var pre = Manifest.getPreference(item);
					if(pre.leaf){
						if(pre.sco){
							html[i] ="<div class=file ><a href=# onclick=$show('"+item.identifier+"') >"+item.title+"</a></div>";
						}else{
							totalcount++;
							var eid = 'div-'+ct.id+"_"+item.identifier;
							html[i]="<div class=folder >"+item.title+"</div><div class='item_content' item='"+item.identifier+"' id='"+eid+"'></div>";
							
							var path = COURSE_PATH+"/"+Manifest.getResourcePath(item.identifierref);		
							
							Ext.Ajax.request({url: path, success: function(r){
								count++;
								var html = self.clearHTML(r.responseText, path);
								if(self.request){								
									self.request.split(",").each(function(word){
										var reg = new RegExp("("+word+")","gi");									
										html = html.replace(reg,"<span style='background-color:#ee0000;'>$1</span>");
									});
								}
								document.getElementById(eid).innerHTML = html;								
								if(count == totalcount) 
									self.initBlocks(item);
							   }
							})	
						}
						
					}else{
						html[i] ="<div class=folder id='"+eid+"'>"+item.title+"</div>";
					}			
				});	
				ct.html = html.join("");
		 }, this);
		  Ext.ux.Book.superclass.initComponent.call(this);
	},
	clearHTML:function(html, path){
			path = path.split('/').slice(0, -1).join('/')+"/";			
			html = html.replace(/<img([^>]*)src="([^>]*)"([^>]*)>/gi,'<img$1src="'+path+'$2"$3>');		
			html = html.replace(/<html>/gi,"");
			html = html.replace(/<\/html>/gi,"");
			html = html.replace(/<body>/gi,"");
			html = html.replace(/<\/body>/gi,"");
			html = html.replace(/<head.*<\/head>/gi,"");
			html = html.replace(/<div>&nbsp;<\/div>/gi,"");			
		return html;
	},
	initBlocks:function(item){		
		var contents = this.body.query('div[class=item_content]');


		var bases = this.body.query("span[id=description]");
			bases.each(function(desc){
				var img = Ext.get(desc).prev().dom;	
				if(img){
					/*new Ext.ToolTip({
						target: img,
						html: 'A very simple tooltip'
					});	*/
					img.title = desc.innerHTML;
					//img["ext:qtip"] = "My QuickTip";					
					//img.style.border = "dashet 1px gray";
				
				}
			});
		

		//if(Ext.sp.Tree.getTypeFromParams(item.parameters) == 'Домашнее задание'){
			//alert(contents[0].innerHTML)
		//}


		for (var k=0;k<contents.length;k++ ){
			var content = Ext.fly(contents[k]);
			var id = content.dom.id.split("_").pop();		
			var blocks = content.query('div[id=block]');
			blocks.each(function(block,i){					
					$(block).addEvents({
						mouseenter:function(){							
							this.className = this.className + " hoover";
						},
						mouseleave:function(){
							this.className = this.className.replace("hoover","");
						}
					});
					
					block = Ext.get(block);

					//block.addClassOnOver('hoover');	
				if(admining){
					block.on('click',function(e){
						if(e.ctrlKey) 
							Ext.getCmp('links').addLeft(id, i);
						if(e.shiftKey) 
							Ext.getCmp('links').addRight(id, i);
					});
				}									
				var links = Ext.getCmp('links').find(id, i);				
				if(links.length){			
					block.dom.innerHTML+="<div class='link' title='[открыть список ссылок]' onclick=Ext.getCmp('links').show('"+id+"',"+i+").visible()></div>";
				}			

				block.dom.innerHTML+="<div class='bookmark-add' title='[добавить в закладки]' onclick=Ext.getCmp('bookmarks').add('"+id+"',"+i+")></div>";

				block.dom.innerHTML += Notes.getIcon(id, i);
			}, this);
			
		}
		if(this.block)
			this.scrollToBlock(this.block);
	}, 
	scrollToBlock:function(block){	
		var el = this.body.query('div[id=block]', true)[block];		
		if(el){
			var top = (Ext.fly(el).getOffsetsTo(this.body)[1]) + this.body.dom.scrollTop;
			this.body.scrollTo('top', top-25, {duration:.5, callback: function(){				
                Ext.fly(el).pause(.2).highlight('#cadaf9');
            }});
        }		
	},
	filter:function(blocktypeid){		
		var items = this.getTopToolbar().items;	
		var all = items.itemAt(0);
		if(blocktypeid == "all"){			
			var p = all.pressed; 
				items.each(function(b,i){if(i!=0) b.toggle(!p)});	
		}else{
			var noone =  items.getRange(1).filter(function(b,i){return b.pressed;}).length == 0;					
			all.toggle(noone);
		}		
		var pressed = items.getRange(0)/*.slice(0,-1)*/.filter(function(b){ return b.pressed==true;});		
		var  all = pressed[0].id == 'all';	
		
		this.body.query('div[class=folder]').each(function(folder){
			 folder.style.display = all?"":"none";
		});
		this.body.query('div[id=block]').each(function(block){
			var  show = pressed.some(function(button){return  block.className.indexOf(button.id)!=-1 });
			block.style.display = (show || all)? "":"none";	
		});
	}
});
//---------------------------------
Ext.ux.Listing = Ext.extend(Ext.Panel, {
     initComponent:function(){
		 Ext.ux.Sco.superclass.initComponent.call(this);
		 var ch =  this.id.indexOf("ch-")>0;
		 var id = this.id.replace("id-","").replace("ch-","");
		 var item = Manifest.getItem(id);
		 var items =ch?[item].concat(item.item):Manifest.toLine(item);
		 var pre = Manifest.getPreference(item);		
		 this.title = pre.title;
		 this.autoScroll = true;
		 this.closable = true;
		 var html = [];
		 Ext.each(items, function(item, i){
			if(item.title == 'preface') return;
			var pre = Manifest.getPreference(item);			
			if(!pre.leaf){
				html[i] = "<div class=folder ><a href=# onclick=$show('"+item.identifier+"') >"+item.title+"</a></div>";
			}else{
				html[i] = "<div class=file ><a href=# onclick=$show('"+item.identifier+"') >"+item.title+"</a></div>";
			}
		});		
		this.html = "<div>"+html.join("</div><div>")+"</div>";
	 }
});
//---------------------------------
Ext.ux.Sco = Ext.extend(Ext.Panel,{
	initComponent:function(){		
		 Ext.ux.Sco.superclass.initComponent.call(this);
		 var id = this.id.replace("id-","");
		 var item = Manifest.getItem(id);
		 var pre = Manifest.getPreference(item);		
		 this.title = pre.title;			
		 this.autoScroll = true;
		 this.closable = true;
		 this.layout = 'fit';		
		 this.add( new Ext.ux.IframeComponent({ url: COURSE_PATH+"/"+Manifest.getResourcePath(item.identifierref)}));		
	}
});
//---------------------------------
function $links(){
	var grid = new Ext.grid.GridPanel({
		id:'links',	 
		hideHeaders :true,
		store: new Ext.data.SimpleStore({fields:[{name: 'firstId'},{name: 'firstBlock'},{name:'secondId'},{name:'secondBlock'},{name:'name'}]}),
		columns: [{header: "Текст", width: 100,  dataIndex: 'name'}],
		viewConfig: {
			forceFit: true
		},
		sm: new Ext.grid.RowSelectionModel({singleSelect:true}), 
		title:'Ссылки',
		iconCls:'link-icon'
	});
	grid.show=function(id, block){		
		var links = this.find(id, block);		
		this.setTitle(links.length?"Ссылки (<b>"+links.length+"</b>)":"Ссылки");
		this.store.loadData(links);
		this.links = links;
		return this;
	};

	grid.visible = function(){
		Ext.getCmp("instruments").expand();
		this.expand();
	};

	grid.find = function(id, block){
		var links = [];
		for (var i=0;i<data.links.length;i++ ){
			var item = [data.links[i][0],data.links[i][1],data.links[i][2],data.links[i][3],data.links[i][5]];
			if(block >=0 ){			
				if(data.links[i][0] == id && data.links[i][1] == block && data.links[i][6]==null|1 ){
					links.push(data.links[i]);
				}
				if(data.links[i][2] == id && data.links[i][3]==block && data.links[i][6]==null|0 ){					
					links.push(item);
				}					
			}else{
				if(data.links[i][0] == id && data.links[i][6]==null|1 )
					links.push(data.links[i]);
				if(data.links[i][2] == id  && data.links[i][6]==null|0 )
					links.push(item);
			}		
		}
		return links;
	};
	grid.on('cellclick', function(grid, row, cell, e){
		var item = grid.links[row];	
		var p1 = currentItem==item[0]?item[2]:item[0];
		var p2 = currentItem==item[0]?item[3]:item[1];
		$show(p1, e.ctrlKey, p2);
	});
	grid.addLeft = function(id, block){
		this.first_id = id;
		this.first_block = block>=0 ?block:null;
		this.addLink();
	};
	grid.addRight = function(id, block){
		this.second_id = id;
		this.second_block =   block>=0 ?block:null;
		this.addLink();
	};

	grid.addLink = function(){
		this.showToolbar();
		if(this.first_id!=null && this.second_id!=null){
			var txt = prompt("ссылка между "+this.first_id +" и "+this.second_id +" введите информацию в следующем виде \"left_caption|right_caption|direction\"");
			if(txt != null){
				var p = txt.split("|");
				var item = [this.first_id, this.first_block, this.second_id, this.second_block,p[0], p[1], p[2] || null];
				data.links.push(item);
			}
			
			this.first_id = this.first_block = this.second_id = this.second_block = null;
		}		
	}

	grid.showToolbar = function(){		
		 if(!this.toolbarwin){
			 var html = [
				"Типа кликните чего нить Ctrl Shift"				 
			 ];
			 this.toolbarwin = new Ext.Window({				
				layout      : 'fit',
				width       : 250,
				title:"Панель создания ссылок",
				height      : 150,
				closeAction :'hide',
			//	html:html[0],
				x:10,
				
				y:10,
				plain       : true,
				tbar:[{
					//id:"win-links-left-button",
					//disabled:true,
					text:"bla",
					disabled:true,
					handler:function(){
						alert('asd');
					}
				},{
					text:"bla2"
				}],
				items:[new Ext.form.TextField({
					emptyText:"прямое название",
					disabled:true
				}),new Ext.form.TextField({
					emptyText:"обратное название[не указывать для односторонней]"					
				})],
				buttons: [{
					id:'win-links-ok-button',
					text     : 'Создать'					
				},{
					text     : 'Отмена',
					handler  : function(){
						this.toolbarwin.hide();
					},
					scope:this
				}]
			});
		 }
		 this.toolbarwin.show();
	}

	grid.checkstate=function(){
		if(this.toolbarwin){
			var ok_button = this.toolbarwin.getComponent('win-links-ok-button');


		}
	};

	return grid;
}
//---------------------------------
function $bookmarks(){
	var get_bookmarks = function(){return [].extend(data.bookmarks)};	
	
	var bookmarkgrid = new Ext.grid.GridPanel({
		id:'bookmarks',	 
		hideHeaders :true,
		store: new Ext.data.SimpleStore({fields:[{name: 'name'},{name: 'id'},{name: 'block'}]}),		
		columns: [{header: "Текст", width: 100,  dataIndex: 'name'}],
		viewConfig: {forceFit: true},
		sm: new Ext.grid.RowSelectionModel({singleSelect:true}), 
		title:'Закладки',
		iconCls:'bookmark-icon',
		tbar:["->",{
			text:"удалить",
			iconCls:'delete',
			handler:function(){
				var selm = bookmarkgrid.getSelectionModel().getSelected();
				data.bookmarks = data.bookmarks.filter(function(bmrk){					
					return bmrk[0]!=selm.data.name || bmrk[1]!=selm.data.id || bmrk[2]!=selm.data.block;
				});				
				bookmarkgrid.show();
			}
		}]
	});
	bookmarkgrid.show=function(){		
		var bmks = get_bookmarks();		
		this.store.loadData(bmks);		
		this.setTitle(bmks.length?"Закладки (<b>"+bmks.length+"</b>)":"Закладки");
		return this;
	};

	bookmarkgrid.add = function(id, block){		
		this.toolbarwin =Ext.getCmp("bookmark-window");
		 if(!this.toolbarwin){			
			 this.toolbarwin = new Ext.Window({	
				id:"bookmark-window",
				layout      : 'fit',
				width       : 350,
				title:"Панель создания закладок",
				height      : 100,
				closeAction :'hide',		
				modal:true,
				plain       : true,
				items:[new Ext.form.TextField({
					id:"bookmark-text",
					emptyText:"Название закладки",
					value:Manifest.getItem(id).title
				})],
				buttons: [{				
					text: 'Создать',
					scope:this,
					handler:function(){
						var text = Ext.getCmp("bookmark-text").getValue();
						if(text == ""){
							alert("Название закладки не может быть пустым!");
							return; 
						}						
									
							data.bookmarks.include([text,id,block>=0?block:null]);							
						
						this.show();	
						this.visible();
						this.toolbarwin.destroy();
					}
				},{
					text     : 'Отмена',
					handler  : function(){
						this.toolbarwin.destroy();
					},
					scope:this
				}]
			});
		 }
		 this.toolbarwin.show();
	};
	bookmarkgrid.on('cellclick', function(grid, row, cell, e){
		var record = grid.getStore().getAt(row);	
		$show(record.data.id, e.ctrlKey, record.data.block);
	});
	

	bookmarkgrid.visible = function(){
		Ext.getCmp("instruments").expand();
		this.expand();
	};
	bookmarkgrid.show();	
	return bookmarkgrid;
}
//---------------------------------
var Notes = {
	get:function(id, block){
		for (var i=0;i<data.notes.length;i++ ){
			if(data.notes[i][0] == id && data.notes[i][1] == block )
				return data.notes[i]
		}
		return null;
	},
	add:function(id, block, html){
		data.notes.include([id,block,html]);
		this.update();
	},
	remove:function(id, block){
		var note = this.get(id, block);
		data.notes = data.notes.erase(note);
		this.update();
	},
	getIcon:function(id, block){
		var note = this.get(id,block);
		var html = [
			"<div class='note-icon-add note-add' title='[добавить заметку]' onclick=Notes.showNote('"+id+"',"+block+")></div>",
			"<div class='note-icon-add note-add show' title='[показать заметку]' onclick=Notes.showNote('"+id+"',"+block+")></div>"
		];
		return note?html[1]:html[0];
	},
	showNote:function(id, block){		
		var note = this.get(id, block);			
		var htmlEditor = new Ext.form.HtmlEditor({enableSourceEdit:false,value:note?note[2]:""});
		var wid = "note-win-"+id+"-"+block;
	    new Ext.Window({	
			id:wid,
			layout:'fit',
			width:550,
			title:note?note[2].slice(0,50)+"...":"Создать заметку",
			height:300,
			tbar:note?[{
				iconCls:'delete',
				text:"Удалить",
				handler:function(){
					var win = Ext.getCmp(wid);
					this.remove(id, block);
					win.destroy();
					$show(id, false, block, "", true);
				},
				scope:this
			}]:null,
			closeAction:'hide',			
			plain: true,
			items:[htmlEditor],
			buttons:[{
				 text:"Ок",
				 handler:function(){
					 var win = Ext.getCmp(wid);
					 var html = htmlEditor.getValue();
					 if(htmlEditor.isDirty() && html!=""){
						if(note){
							this.remove(note);
						}
						this.add(id, block, html);
						$show(id, false, block, "", true);
					 }				
					 win.destroy();
				 },
				 scope:this
			},{
				 text:"Отмена",
				 handler:function(){
					Ext.getCmp(wid).destroy();
				 }
			}]
		}).show();		
	},
	list:function(){
		var grid = new Ext.grid.GridPanel({
			id:'notes',	 
			hideHeaders :true,
			store: new Ext.data.SimpleStore({fields:[{name: 'id'},{name: 'block'},{name: 'name'}]}),
			//data:data.notes,
			columns: [{header: "Текст", width: 100,  dataIndex: 'name'}],
			viewConfig: {forceFit: true},
			sm: new Ext.grid.RowSelectionModel({singleSelect:true}), 
			title:'Заметки',
			iconCls:'note-icon-add'
		});
		grid.on('cellclick', function(grid, row, cell, e){
			var record = grid.getStore().getAt(row);
			$show(record.data.id, e.ctrlKey, record.data.block);
		});
		this.grid = grid;
		this.update();
		return grid;
	},
	update:function(){
		this.grid.store.loadData(data.notes.map(function(item){
			item[2] = item[2].split(' ').slice(0,4).join(" "); 
			return item;  
		}));		
		this.grid.setTitle(data.notes.length?"Заметки (<b>"+data.notes.length+"</b>)":"Заметки");
	}
};
//---------------------------------
function $show(itemId, newtab, block, request, forse){

		Ext.getCmp('links').show(itemId, block);	
		Ext.getCmp('content').show(itemId, newtab, block, request,forse);	
		Ext.getCmp('organization').show(itemId);		
}
/*start up*/
Ext.BLANK_IMAGE_URL = "./ext/resources/images/default/s.gif";
Ext.onReady(function(){	  


	if( Ext.isIE8 ) {
		var path = engine[1]+"/browser_info.html";		
		window.navigate(path);
		return;
	}
	  Ext.QuickTips.init();

//-------------------------------------------------
	
	Store.loadAll();
	window.onunload = function(){
		Store.saveAll();
	}

	var vp = new Ext.Viewport({
		id:'viewport',
		layout: 'border',		
		items: [{
			region: 'north',
			html: '<h1 class="x-panel-header">'+Manifest.getTitle()+'</h1>',
			autoHeight: true,
			border: false,
			margins: '0 0 5 0'
		},{		
		title:"Содержание",
		id:'organisation-container',
		collapsible: true,
		width: 400,		
		layout:'fit',		
		split: true,
		region: 'west',
		items:	new Ext.sp.Organization()
			
		},{
				title:"Инструменты",
				layout: 'accordion',				
				id: 'instruments',
				region:'east',
				border: false,
				collapsible: true,				
				collapsed:true,
				split:true,				
				width: 275,
				minSize: 100,
				maxSize: 500,
				items: [$links(),$bookmarks(),Notes.list()]
		
			},{
			id:'content',
			region: 'center',
			xtype: 'content',
			padding:"5 5 5 5",
			enableTabScroll: true,
			activeItem:0,
			items:[new Ext.ux.IframeComponent({
				title:"О курсе",
				closable:true,
				url:COURSE_PATH+"/courseabout.html"
			})]
		}],		
        renderTo: Ext.getBody()
	});	

	 Ext.getCmp('organization').getRootNode().expandChildNodes(2);
	Ext.sp.Search.tryinit(function(){});	
});

