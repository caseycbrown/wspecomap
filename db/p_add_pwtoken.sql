/*before adding new token, calls delete to clean out any expired*/

delimiter //
drop procedure if exists add_pwtoken//
create procedure add_pwtoken(  
  in in_user_id int,
  in in_token varchar(255)
)
begin		
	call delete_pwtoken(null);
  
  insert into
    pwtoken(
      user_id,
      token,
      expiration
    )
  values (
    in_user_id,
    in_token,
    now() + interval 48 hour
    
  );

end//
delimiter ;