/*
  deletes a tree.  removes from tree table, as well as associated observations
*/

delimiter //
drop procedure if exists delete_tree //
create procedure delete_tree (
  in in_tree_id int
)
begin		
	
  call delete_observation(null, in_tree_id, null);
  call delete_tree_layer(in_tree_id, null);
  
  delete from
    tree
	where
    in_tree_id = tree.tree_id
  ;
end//
delimiter ;