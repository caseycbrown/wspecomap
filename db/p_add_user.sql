/*adds a user and returns its id*/

delimiter //
drop procedure if exists add_user//
create procedure add_user(  
  in in_email varchar(255),
  in in_display_name varchar(40),
  in in_password varchar(100)
)
begin		
	insert into
    users (      
      email,
      display_name,
      password
    )
  values (    
    in_email,
    in_display_name,
    in_password
  );
	
  select last_insert_id() as user_id;
    
end//

delimiter ;