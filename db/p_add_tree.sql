/*
  adds a tree and returns its id
*/

delimiter //
drop procedure if exists add_tree//
create procedure add_tree (  
  in in_taxon_id int,
  in in_dbh int,
  in in_lat decimal(10, 7),
  in in_lng decimal(10, 7)
)
begin		
	insert into
    tree (      
      taxon_id,
      dbh,
      lat,
      lng
    )
  values (    
    in_taxon_id,
    in_dbh,
    in_lat,
    in_lng
  );
	
  select last_insert_id() as tree_id;
    
end//

delimiter ;