/*adds a user and returns its id*/

delimiter //
drop procedure if exists add_user//
create procedure add_user(  
  in in_username varchar(25),
  in in_email varchar(255),  
  in in_password varchar(100)
)
begin		
	insert into
    users (      
      email,
      username,
      password
    )
  values (    
    in_email,
    in_username,
    in_password
  );
	
  select last_insert_id() as user_id;
    
end//

delimiter ;