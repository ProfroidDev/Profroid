package com.profroid.profroidapp.customersubdomain.mappingLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerResponseModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CustomerResponseMapper {
    @Mappings({
            @Mapping(source = "customer.customerIdentifier.customerId", target = "customerId"),
            @Mapping(source = "customer.firstName", target = "firstName"),
            @Mapping(source = "customer.lastName", target = "lastName"),

            // Mapping Address fields
            @Mapping(source = "customer.customerAddress.streetAddress", target = "streetAddress"),
            @Mapping(source = "customer.customerAddress.city", target = "city"),
            @Mapping(source = "customer.customerAddress.province", target = "province"),
            @Mapping(source = "customer.customerAddress.country", target = "country"),
            @Mapping(source = "customer.customerAddress.postalCode", target = "postalCode"),
            @Mapping(source = "customer.userId", target = "userId"),
    })
    CustomerResponseModel toResponseModel(Customer customer);

    List<CustomerResponseModel> toResponseModelList(List<Customer> customers);
}
