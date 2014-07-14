/*returns trees filtered by optional filters
  north, south, east, and west are boundaries - if specified, will return
  trees that are south, north, west, and east of them respectively
  north/south are latitude, east/west are longitude
*/

delimiter //
drop procedure if exists get_tree//
create procedure get_tree(
  in in_tree_id int,
  in in_taxon_id int,
  in in_dbh_min int,
  in in_dbh_max int,
  in in_north decimal(10,7),
  in in_south decimal(10,7),
  in in_east decimal(10,7),
  in in_west decimal(10,7)
)
begin		  
    
  select
    tree_id,
    taxon_id,
    dbh,
    lat,
    lng
  from
    tree
  where
    tree_id = ifnull(in_tree_id, tree_id)
    and (taxon_id = ifnull(in_taxon_id, taxon_id))
    and ((in_dbh_min is null) or (dbh >= in_dbh_min))
    and ((in_dbh_max is null) or (dbh <= in_dbh_max))
    and ((in_north is null) or (lat <= in_north))
    and ((in_south is null) or (lat >= in_south))
    and ((in_east is null) or (lng <= in_east))
    and ((in_west is null) or (lng >= in_west))
  ;
    
end//
delimiter ;