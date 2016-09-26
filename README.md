# i-are-dba

I are DBA produces CREATE TABLE SQL statements based on the data to be written to the table. 

## Known issues

Due to a shortcoming in node, it is only possible to make the most of the BIGINTEGER type if you pass large numbers as type `String`. This affects numbers above 9007199254740991 or below -9007199254740991.
