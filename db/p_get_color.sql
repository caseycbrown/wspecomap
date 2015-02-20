/*
  returns colors filtered by the optional criteria.
  
  passing null for an input parameter will cause it to be ignored as a search
  criteria
*/

delimiter //
drop procedure if exists get_color //
create procedure get_color (
  in in_color_id int
)
begin		  
    
  select
    color_id,
    hex_value,
    description
  from
    color
  where
    color_id = ifnull(in_color_id, color_id)    
  ;
    
end//
delimiter ;