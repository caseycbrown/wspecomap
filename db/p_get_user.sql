/*returns info for a given user.  can look up using either user_id or email*/

delimiter //
drop procedure if exists get_user//
create procedure get_user(
  in in_user_id int,
  in in_email varchar(255)
)
begin		
	select		
		user_id,
    email,
    display_name,
    password
	from
    users
	where				
    user_id = ifnull(in_user_id, user_id)    
    and email = ifnull(in_email, email)    
  ;
end//
delimiter ;