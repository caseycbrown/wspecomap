/*returns info for a given user.  can look up using either user_id, username, or email*/

delimiter //
drop procedure if exists get_user//
create procedure get_user(
  in in_user_id int,
  in in_username varchar(25),
  in in_email varchar(255)  
)
begin		
	select		
		user_id,
    username,
    email,
    password,
    display_name,    
    first_name,
    last_name,
    postal_code,
    is_verified
	from
    users
	where				
    user_id = ifnull(in_user_id, user_id)    
    and email = ifnull(in_email, email)    
    and username = ifnull(in_username, username)    
  ;
end//
delimiter ;