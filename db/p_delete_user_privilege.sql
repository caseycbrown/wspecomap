/*
  deletes privilege(s) for given user.
  if privilege_code is given, deletes only that privilege; else deletes all
*/

delimiter //
drop procedure if exists delete_user_privilege //
create procedure delete_user_privilege (
  in in_user_id int,
  in in_privilege_code int
)
begin		
	delete from
    user_privilege		
	where				
    user_id = in_user_id
    and ((in_privilege_code is null) or (privilege_code = in_privilege_code))
  ;
end//
delimiter ;