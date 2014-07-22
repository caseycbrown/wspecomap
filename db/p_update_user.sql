delimiter //
drop procedure if exists update_user//
create procedure update_user(
  in in_user_id int,  
  in in_email varchar(255),
  in in_display_name varchar(40),
  in in_password varchar(100)
)
begin		
	update
    users
  set    
    email = ifnull(in_email, email),
    display_name = ifnull(in_display_name, display_name),
    password = ifnull(in_password, password)
  where
    user_id = in_user_id
    
  ;
    
end//
delimiter ;