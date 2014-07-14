/*updates tree record.*/

delimiter //
drop procedure if exists update_tree//
create procedure update_tree(
  in in_tree_id int,
  in in_taxon_id int,
  in in_dbh int,
  in in_lat decimal(10,7),
  in in_lng decimal(10,7)
)
begin
	update
    tree
  set
    taxon_id = in_taxon_id,
    dbh = in_dbh,
    lat = in_lat,
    lng = in_lng
  where
    tree_id = in_tree_id
    
  ;
    
end//
delimiter ;