/*
  returns info about privilege(s)
*/

delimiter //
drop procedure if exists get_privilege //
create procedure get_privilege (
  in in_privilege_code int
)
begin		
	select		
    privilege_code,
    name,
    description
	from
    privilege
	where				
    privilege_code = ifnull(in_privilege_code, privilege_code)
  ;
end//
delimiter ;