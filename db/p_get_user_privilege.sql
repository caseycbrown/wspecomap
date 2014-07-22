/*
  returns privilege info for given user
*/

delimiter //
drop procedure if exists get_user_privilege //
create procedure get_user_privilege (
  in in_user_id int
)
begin		
	select		
		user_id,
    privilege_code
	from
    user_privilege
	where				
    user_id = in_user_id
  ;
end//
delimiter ;