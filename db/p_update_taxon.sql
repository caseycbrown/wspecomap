/*updates taxon record.
*/

delimiter //
drop procedure if exists update_taxon//
create procedure update_taxon(
  in in_taxon_id int,
  in in_genus varchar(100),
  in in_species varchar(100),
  in in_common varchar(100),
  in in_usda_code varchar(100),
  in in_color_id int
)
begin		
	update
    taxon
  set
    genus = in_genus,
    species = in_species,
    common = in_common,
    usda_code = in_usda_code,
    color_id = in_color_id
  where
    taxon_id = in_taxon_id
    
  ;
    
end//
delimiter ;