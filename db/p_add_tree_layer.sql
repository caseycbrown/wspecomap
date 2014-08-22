/*
  adds a tree to a layer
*/

delimiter //
drop procedure if exists add_tree_layer//
create procedure add_tree_layer (  
  in in_tree_id int,
  in in_layer_id int
)
begin		
	insert into
    tree_layer (      
      tree_id,
      layer_id
    )
  values (    
    in_tree_id,
    in_layer_id
  );
	    
end//

delimiter ;