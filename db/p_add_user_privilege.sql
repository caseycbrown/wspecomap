/*
  adds a privilege to a user
*/

delimiter //
drop procedure if exists add_user_privilege//
create procedure add_user_privilege (  
  in in_user_id int,
  in in_privilege_code int
)
begin		
	insert into
    user_privilege (      
      user_id,
      privilege_code
    )
  values (    
    in_user_id,
    in_privilege_code
  );
	    
end//

delimiter ;