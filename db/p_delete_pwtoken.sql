/*deletes tokens that match the given user_id or that have expired*/

delimiter //
drop procedure if exists delete_pwtoken//
create procedure delete_pwtoken(  
  in in_user_id int
)
begin		
	
  delete from
    pwtoken
  where
    user_id = in_user_id
    or expiration <= now()
  
  ;
end//
delimiter ;