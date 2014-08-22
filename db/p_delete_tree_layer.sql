/*
  deletes layer(s) for given tree.
  if layer_id is given, deletes only that layer; else deletes all layers for tree
*/

delimiter //
drop procedure if exists delete_tree_layer //
create procedure delete_tree_layer (
  in in_tree_id int,
  in in_layer_id int
)
begin		
	delete from
    tree_layer		
	where				
    tree_id = in_tree_id
    and ((in_layer_id is null) or (layer_id = in_layer_id))
  ;
end//
delimiter ;