package com.profroid.profroidapp.customersubdomain.mappingLayer;


import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerPhoneNumber;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerRequestModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface CustomerRequestMapper {
    @Mappings({
            @Mapping(source = "customerIdentifier", target = "customerIdentifier"),
            @Mapping(source = "customerRequestModel.firstName", target = "firstName"),
            @Mapping(source = "customerRequestModel.lastName", target = "lastName"),

            // Mapping Address fields
            @Mapping(source = "customerRequestModel.streetAddress", target = "customerAddress.streetAddress"),
            @Mapping(source = "customerRequestModel.city", target = "customerAddress.city"),
            @Mapping(source = "customerRequestModel.province", target = "customerAddress.province"),
            @Mapping(source = "customerRequestModel.country", target = "customerAddress.country"),
            @Mapping(source = "customerRequestModel.postalCode", target = "customerAddress.postalCode"),

            // Mapping Phone Numbers if needed
            @Mapping(source = "customerRequestModel.phoneNumbers", target = "phoneNumbers"),
            @Mapping(source = "customerRequestModel.userId", target = "userId"),
    })
    Customer toEntity(CustomerRequestModel customerRequestModel, CustomerIdentifier customerIdentifier);
}
