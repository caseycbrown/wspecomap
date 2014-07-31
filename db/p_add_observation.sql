delimiter //
drop procedure if exists add_observation//
create procedure add_observation(
  in in_tree_id int,
  in in_user_id int,
  in in_comments varchar(200)
)
begin		
	insert into
    observation (
      tree_id,
      comments,
      date_created,
      user_id
    )
  values (
    in_tree_id,
    in_comments,
    now(),
    in_user_id
  );
	
  select last_insert_id() as observation_id;
    
end//

delimiter ;