/*Руководитель проекта: Третьяков В.С.
Разработка:Савельев А.А., Трояновский М.Б., Титов И.В.,  Катков А.Ю., Громов И.В.
Дизайн: Щербаков А.В.
ГОУ ВПО "УГТУ-УПИ имени первого Президента России Б.Н.Ельцина"
Центр Информационного компьютерного обеспечения 2008-2009г*/

var Store = {
	set:function(name, arr, length){	
		
		var records = [];
		var quests = [];
		for (var i=0;i<length;i++){
			records[i] = "record_"+i+" text";
			quests[i] = "?";
		}			
		var db = google.gears.factory.create('beta.database');				
			db.open('sp.store');			
			db.execute('drop table if exists '+name);				
			db.execute('create table if not exists '+name+' ('+records.join(",")+')');				
			arr.each(function(record){					
				db.execute('insert into '+name+' values ('+quests.join(',')+')', record);					
			});		
		
	},
	get:function(name, length){
		var res = [];		
		try{
			var db = google.gears.factory.create('beta.database');
			db.open('sp.store');		
			var rs = db.execute('select * from '+name);	
			while (rs.isValidRow()) {
				var record = [];
				for (var i=0;i<length;i++ ){				
					record[i] = rs.field(i);
				}
				res.push(record);
			  rs.next();
			}
			rs.close();
		}catch(e){return null;}
		return res;
	},
	loadAll:function(){
		if(window.google && google.gears){
			data.bookmarks = Store.get("bookmarks",3) || data.bookmarks;
			data.notes = Store.get("notes",3) || data.notes;
			data.links = Store.get("links",7) || data.links;			
		}
	},
	saveAll:function(){
		if(window.google && google.gears){			
			try{
			Store.set("bookmarks",data.bookmarks,3);			
			Store.set("notes",data.notes,3);			
			Store.set("links",data.links,7);				
			}catch(e){alert(e)}
			
		}
	}
}

