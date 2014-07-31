/*returns observations filtered by optional criteria
*/

delimiter //
drop procedure if exists get_observation//
create procedure get_observation(
  in in_observation_id int,
  in in_tree_id int,
  in in_user_id int,
  in in_start_date datetime,
  in in_end_date datetime
)
begin		  
    
  select
    observation_id,
    tree_id,
    comments,
    date_created,
    user_id
  from
    observation
  where
    observation_id = ifnull(in_observation_id, observation_id)
    and (tree_id = ifnull(in_tree_id, tree_id))
    and ((in_user_id is null) or (user_id = in_user_id))
    and date_created >= ifnull(in_start_date, date_created)
    and date_created <= ifnull(in_end_date, date_created)
    
  ;
    
end//
delimiter ;