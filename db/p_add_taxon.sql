/*adds a taxon and returns its id*/

delimiter //
drop procedure if exists add_taxon//
create procedure add_taxon(  
  in in_genus varchar(100),
  in in_species varchar(100),
  in in_common varchar(100),
  in in_usda_code varchar(100),
  in in_color_id int
)
begin		
	insert into
    taxon (      
      genus,
      species,
      common,
      usda_code,
      color_id
    )
  values (    
    in_genus,
    in_species,
    in_common,
    in_usda_code,
    in_color_id
  );
	
  select last_insert_id() as taxon_id;
    
end//

delimiter ;