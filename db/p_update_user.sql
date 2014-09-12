delimiter //
drop procedure if exists update_user//
create procedure update_user(
  in in_user_id int,  
  in in_username varchar(25),
  in in_email varchar(255),
  in in_password varchar(100),
  in in_display_name varchar(25),
  in in_first_name varchar(40),
  in in_last_name varchar(40),
  in in_postal_code varchar(32)
  
)
begin		
	update
    users
  set    
    username = ifnull(in_username, username),    
    email = ifnull(in_email, email),        
    password = ifnull(in_password, password),
    display_name = ifnull(in_display_name, display_name),
    first_name = ifnull(in_first_name, first_name),
    last_name = ifnull(in_last_name, last_name),
    postal_code = ifnull(in_postal_code, postal_code)
  where
    user_id = in_user_id
    
  ;
    
end//
delimiter ;