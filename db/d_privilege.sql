/*
  populate privilege table
*/


insert into
  privilege (
    privilege_code,
    name,
    description
  )
values
  (1, 'add user', 'can add a new user to the database'),
  (2, 'modify user', 'can modify info about other users'),
  (3, 'delete user', 'can delete other users from database'),
  (4, 'add tree', 'can add a new tree'),
  (5, 'update tree', 'can update information about an existing tree'),
  (6, 'delete tree', 'can delete trees'),
  (7, 'add taxon', 'can add a new taxon'),
  (8, 'update taxon', 'can update information about an existing taxon'),
  (9, 'delete taxon', 'can delete a taxon')
;