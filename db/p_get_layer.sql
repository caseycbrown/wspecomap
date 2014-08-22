/*
  returns layers filtered by the optional criteria.
  
  passing null for an input parameter will cause it to be ignored as a search
  criteria
*/

delimiter //
drop procedure if exists get_layer //
create procedure get_layer (
  in in_layer_id int
)
begin		  
    
  select
    layer_id,
    name,
    description
  from
    layer
  where
    layer_id = ifnull(in_layer_id, layer_id)    
  ;
    
end//
delimiter ;