/*gets any unexpired password tokens (and deletes any expired)*/

delimiter //
drop procedure if exists get_pwtoken//
create procedure get_pwtoken(  
  in in_user_id int
)
begin		
	call delete_pwtoken(null);
  
  select				
    pwtoken_id,
    user_id,
    token,
    expiration
	from
    pwtoken
	where				
    user_id = in_user_id
  ;
end//
delimiter ;