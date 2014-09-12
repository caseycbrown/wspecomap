/*
  deletes a user.  removes entries from all tables that store user:
  user_privilege,
  observation,
  pwtoken
  users
*/

delimiter //
drop procedure if exists delete_user //
create procedure delete_user (
  in in_user_id int
)
begin		
	
  call delete_user_privilege(in_user_id, null);
  call delete_observation(null, null, in_user_id);
  call delete_pwtoken(in_user_id);
  
  delete from
    users
	where
    user_id = in_user_id
  ;
end//
delimiter ;