/*adds a taxon and returns its id*/

delimiter //
drop procedure if exists add_taxon//
create procedure add_taxon(  
  in in_genus varchar(100),
  in in_species varchar(100),
  in in_common varchar(100)
)
begin		
	insert into
    taxon (      
      genus,
      species,
      common
    )
  values (    
    in_genus,
    in_species,
    in_common
  );
	
  select last_insert_id() as taxon_id;
    
end//

delimiter ;