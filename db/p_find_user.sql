/*searches for user*/

delimiter //
drop procedure if exists find_user //
create procedure find_user(
  in in_query varchar(255)
)
begin		
	select		
		user_id,
    username,
    email,
    display_name,    
    first_name,
    last_name,
    postal_code,
    is_verified
	from
    users
	where				
    email like concat('%', in_query, '%')
    or username like concat('%', in_query, '%')
    or display_name like concat('%', in_query, '%')
  ;
end//
delimiter ;