delimiter //
drop procedure if exists update_observation//
create procedure update_observation (
  in in_observation_id int,
  in in_comments varchar(200)
)
begin		
	update
    observation
  set    
    comments = in_comments
  where
    observation_id = in_observation_id
    
  ;
    
end//
delimiter ;