/*
  deletes observation.  can delete all by user or tree if desired.  at least
  one of the input parameters must be defined
*/

delimiter //
drop procedure if exists delete_observation //
create procedure delete_observation (
  in in_observation_id int,
  in in_tree_id int,
  in in_user_id int
)
begin		
	delete from
    observation
	where
    ((in_observation_id is not null) or (in_tree_id is not null) or
      (in_user_id is not null))
    and ((in_observation_id is null) or (observation_id = in_observation_id))
    and ((in_tree_id is null) or (tree_id = in_tree_id))
    and ((in_user_id is null) or (user_id = in_user_id))
  ;
end//
delimiter ;