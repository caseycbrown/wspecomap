/*returns taxon records filtered by the optional criteria.
  
  passing null for an input parameter will cause it to be ignored as a search
  criteria
*/

delimiter //
drop procedure if exists get_taxon//
create procedure get_taxon(
  in in_taxon_id int,
  in in_genus varchar(100),
  in in_species varchar(100),
  in in_common varchar(100),
  in in_usda_code varchar(100)
)
begin		  
    
  select
    taxon_id,
    genus,
    species,
    common,
    usda_code,
    color_id
  from
    taxon
  where
    taxon_id = ifnull(in_taxon_id, taxon_id)
    and ((in_genus is null) or (genus like(concat('%', in_genus, '%'))))
    and ((in_species is null) or (species like(concat('%', in_species, '%'))))
    and ((in_common is null) or (common like(concat('%', in_common, '%'))))
    and ((in_usda_code is null) or (usda_code like(concat('%', in_usda_code, '%'))))
  order by
    genus asc,
    species asc
  ;
    
end//
delimiter ;