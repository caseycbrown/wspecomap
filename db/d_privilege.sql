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
  (1, 'modify user', 'can modify info about other users'),
  (2, 'add tree', 'can add a new tree'),
  (3, 'update tree', 'can update information about an existing tree'),
  (4, 'delete tree', 'can delete trees'),
  (5, 'add taxon', 'can add a new taxon'),
  (6, 'add observation', 'can add a new observation'),
  (7, 'modify observation', 'can update and delete observations created by other users'),
  (8, 'update taxon', 'can update information about an existing taxon')

;